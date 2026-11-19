import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useAsyncRunner, useFrameOutput } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';

import { clamp01, modelRectToFrameRect, uprightSize } from '../../geometry';
import type {
  Detection,
  DetectionFrame,
  DetectorStatus,
  ObjectDetector,
  ObjectDetectorOptions,
} from '../../types';
import type { TfliteDetectorModel } from './types';

/** Worklet thread'inde de çalışabilen, hata nesnesinden okunabilir bir metin çıkarır. */
function describeError(e: unknown): string {
  'worklet';
  if (e != null && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

const DEFAULT_SCORE_THRESHOLD = 0.5;
const DEFAULT_MAX_RESULTS = 10;

/**
 * TFLite (react-native-fast-tflite) tabanlı tespit motoru.
 * Hangi modelin kullanıldığını bilmez; model özelliklerini `TfliteDetectorModel` adaptöründen alır.
 *
 * Akış (hepsi cihaz üzerinde): kare -> GPU'da yeniden boyutlandırma (contain, rotasyon düzeltilir)
 * -> TFLite çıkarımı -> adaptörün decode'u -> kare koordinatlarına dönüşüm -> React state.
 */
export function useTfliteDetector(
  model: TfliteDetectorModel,
  options: ObjectDetectorOptions = {},
): ObjectDetector {
  const scoreThreshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD;
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;

  const tflite = useTensorflowModel(model.source, model.delegates);
  const resizerState = useResizer({
    width: model.inputSize.width,
    height: model.inputSize.height,
    channelOrder: 'rgb',
    dataType: 'uint8',
    pixelLayout: 'interleaved',
    // Tüm görüş alanı taransın diye kırpma yok; boş alan siyah bantla doldurulur.
    scaleMode: 'contain',
  });
  const asyncRunner = useAsyncRunner();
  const [result, setResult] = useState<DetectionFrame | null>(null);

  // scheduleOnRN, RN runtime'ında tanımlı bir fonksiyon ister.
  const publish = useCallback((next: DetectionFrame) => {
    jsReceived.current += 1;
    setResult(next);
    setRuntimeError(null);
  }, []);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const reportError = useCallback((message: string) => setRuntimeError(message), []);

  // --- Tanı (diagnostics) -------------------------------------------------------------
  // `scheduleOnRN` köprüsünden BAĞIMSIZ: paylaşılan (Synchronizable) sayaçlar worklet
  // thread'lerinde yazılır, JS tarafı periyodik okur. Köprü bozuksa bile ne olduğu görünür.
  const diag = useMemo(
    () => ({
      frames: createSynchronizable(0), // onFrame çağrı sayısı
      notReady: createSynchronizable(0), // model/resizer hazır görünmediği için atlanan kare
      busy: createSynchronizable(0), // runner meşgul olduğu için atlanan kare
      done: createSynchronizable(0), // adımları başarıyla biten kare
      lastCount: createSynchronizable(0), // son karedeki tespit sayısı (eşikten sonra)
      topScore: createSynchronizable(-1), // son karedeki en yüksek ham skor (eşikten önce)
      seen: createSynchronizable(''), // worklet'in gördüğü model/resizer durumu
      stage: createSynchronizable(''), // son hata: "adım: mesaj"
    }),
    [],
  );
  const jsReceived = useRef(0);
  const [diagnostics, setDiagnostics] = useState<string | undefined>(undefined);
  const diagnosticsEnabled = options.diagnostics === true;

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    // Rotasyonu CPU yerine GPU'daki resizer yapsın.
    enablePhysicalBufferRotation: false,
    onFrame(frame) {
      'worklet';
      diag.frames.setBlocking(diag.frames.getBlocking() + 1);
      diag.seen.setBlocking(`${tflite.state}/${resizerState.state}`);
      const loaded = tflite.state === 'loaded' ? tflite.model : undefined;
      const resizer = resizerState.state === 'ready' ? resizerState.resizer : undefined;
      if (loaded == null || resizer == null) {
        diag.notReady.setBlocking(diag.notReady.getBlocking() + 1);
        frame.dispose();
        return;
      }

      const upright = uprightSize(frame.width, frame.height, frame.orientation);
      const handled = asyncRunner.runAsync(() => {
        'worklet';
        // Hangi adımda olduğumuzu izle: worklet thread'inde yakalanmamış bir hata uygulamayı
        // çökertir (abort), bu yüzden hatayı yakalayıp adım adıyla birlikte arayüze bildiriyoruz.
        let stage = 'resize';
        try {
          const resized = resizer.resize(frame);
          let input: ArrayBuffer;
          try {
            stage = 'copy';
            // Resizer çıktısını dispose'dan ÖNCE kopyala; kopya tam boyutlu ve bağımsızdır.
            input = new Uint8Array(resized.getPixelBuffer()).slice().buffer;
          } finally {
            resized.dispose();
          }
          stage = 'inference';
          const outputs = loaded.runSync([input]);

          stage = 'decode';
          const best = model.decode(outputs, { scoreThreshold: 0, maxResults: 1 })[0];
          diag.topScore.setBlocking(best != null ? best.score : -1);
          const detections: Detection[] = model
            .decode(outputs, { scoreThreshold, maxResults })
            .map((d) => {
              const r = modelRectToFrameRect(d.box, upright, model.inputSize);
              const x1 = clamp01(r.x);
              const y1 = clamp01(r.y);
              const x2 = clamp01(r.x + r.width);
              const y2 = clamp01(r.y + r.height);
              return {
                label: d.label,
                score: d.score,
                box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
              };
            });

          diag.lastCount.setBlocking(detections.length);
          stage = 'publish';
          scheduleOnRN(publish, {
            detections,
            frameWidth: upright.width,
            frameHeight: upright.height,
          });
          diag.done.setBlocking(diag.done.getBlocking() + 1);
        } catch (e) {
          const message = `${stage}: ${describeError(e)}`;
          diag.stage.setBlocking(message);
          try {
            scheduleOnRN(reportError, message);
          } catch {
            // Bildirim de başarısız olursa en azından çökmeyelim.
          }
        } finally {
          frame.dispose();
        }
      });
      if (!handled) {
        // Çalıştırıcı meşgul: bu kareyi atla.
        diag.busy.setBlocking(diag.busy.getBlocking() + 1);
        frame.dispose();
      }
    },
  });

  const tfliteState = tflite.state;
  const resizerStateName = resizerState.state;
  const modelInfo =
    tflite.state === 'loaded'
      ? `in ${tflite.model.inputs.map((t) => `${t.dataType}[${t.shape.join(',')}]`).join(' ')} ` +
        `out ${tflite.model.outputs.map((t) => `[${t.shape.join(',')}]`).join(' ')}`
      : '';
  useEffect(() => {
    if (!diagnosticsEnabled) return;
    const id = setInterval(() => {
      const workletError = diag.stage.getBlocking();
      setDiagnostics(
        [
          `js: model=${tfliteState} resizer=${resizerStateName}`,
          `worklet sees: ${diag.seen.getBlocking() || '-'}`,
          `frames=${diag.frames.getBlocking()} notReady=${diag.notReady.getBlocking()} busy=${diag.busy.getBlocking()}`,
          `done=${diag.done.getBlocking()} jsReceived=${jsReceived.current}`,
          `detections=${diag.lastCount.getBlocking()} topScore=${diag.topScore.getBlocking().toFixed(2)}`,
          modelInfo,
          workletError ? `ERR ${workletError}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }, 500);
    return () => clearInterval(id);
  }, [diagnosticsEnabled, diag, tfliteState, resizerStateName, modelInfo]);

  let status: DetectorStatus = 'ready';
  let error: Error | undefined;
  if (tflite.state === 'error') {
    status = 'error';
    error = tflite.error;
  } else if (resizerState.state === 'error') {
    status = 'error';
    error = resizerState.error;
  } else if (runtimeError != null) {
    status = 'error';
    error = new Error(runtimeError);
  } else if (tflite.state === 'loading' || resizerState.state === 'loading') {
    status = 'loading';
  }

  // Çıktı her zaman verilir: durum değişince kamera oturumu yeniden yapılandırılmasın (titreme olmasın).
  return { status, error, outputs: [frameOutput], result, diagnostics };
}
