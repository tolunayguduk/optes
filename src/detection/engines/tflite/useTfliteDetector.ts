import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useFrameOutput } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';

import { rgbToBmpDataUri } from '../../debugImage';
import { clamp01, mirrorRect, modelRectToFrameRect, uprightSize } from '../../geometry';
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
const DEFAULT_MAX_RESULTS = 20;

/**
 * TFLite (react-native-fast-tflite) tabanlı tespit motoru.
 * Hangi modelin kullanıldığını bilmez; model özelliklerini `TfliteDetectorModel` adaptöründen alır.
 *
 * Akış (hepsi cihaz üzerinde): kare -> GPU'da yeniden boyutlandırma (contain, rotasyon düzeltilir)
 * -> TFLite çıkarımı -> adaptörün decode'u -> kare koordinatlarına dönüşüm -> React state.
 *
 * Kare işleme, kameranın kendi worklet thread'inde (React JS thread'inden ayrı) yapılır.
 * Vision Camera'nın `AsyncRunner`'ı KULLANILMAZ: iOS'ta onda yakalanamayan bir C++ istisnası
 * uygulamayı çökertti (bkz. CLAUDE.md, 2026-11-20). Yavaş kareler kamera tarafından atlanır.
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
  const [result, setResult] = useState<DetectionFrame | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // --- Tanı (diagnostics) -------------------------------------------------------------
  // `scheduleOnRN` köprüsünden BAĞIMSIZ: paylaşılan (Synchronizable) sayaçlar worklet
  // thread'inde yazılır, JS tarafı periyodik okur. Köprü bozuksa bile ne olduğu görünür.
  const diag = useMemo(
    () => ({
      frames: createSynchronizable(0), // onFrame çağrı sayısı
      notReady: createSynchronizable(0), // model/resizer hazır görünmediği için atlanan kare
      done: createSynchronizable(0), // adımları başarıyla biten kare
      errors: createSynchronizable(0), // hata sayısı
      lastCount: createSynchronizable(0), // son karedeki tespit sayısı (eşikten sonra)
      topScore: createSynchronizable(-1), // son karedeki en yüksek ham skor (eşikten önce)
      seen: createSynchronizable(''), // worklet'in gördüğü model/resizer durumu
      lastError: createSynchronizable(''), // son hata: "adım: mesaj"
      meta: createSynchronizable(''), // son karenin boyut ve yön bilgisi
      best: createSynchronizable(''), // en yüksek skorlu ham tespit (model uzayı)
    }),
    [],
  );
  const jsReceived = useRef(0);
  const [diagnostics, setDiagnostics] = useState<string | undefined>(undefined);
  const diagnosticsEnabled = options.diagnostics === true;

  // scheduleOnRN, RN runtime'ında tanımlı bir fonksiyon ister.
  const publish = useCallback((next: DetectionFrame) => {
    jsReceived.current += 1;
    setResult(next);
    setRuntimeError(null);
  }, []);
  const reportError = useCallback((message: string) => setRuntimeError(message), []);
  const [diagnosticsImage, setDiagnosticsImage] = useState<string | undefined>(undefined);
  const publishThumb = useCallback((uri: string) => setDiagnosticsImage(uri), []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    // Kareler fiziksel olarak dik (orientation 'up') gelsin: kare koordinatları = dik koordinatlar.
    // (Kameranın kare<->önizleme dönüşümleri bu varsayımla tutarlı çalışır.)
    enablePhysicalBufferRotation: true,
    onFrame(frame) {
      'worklet';
      // Worklet thread'inde yakalanmamış bir hata uygulamayı çökertir (abort); bu yüzden her şey
      // try/catch içinde, hata bildirimi de ayrıca korumalı ve kare her koşulda serbest bırakılır.
      let stage = 'start';
      try {
        diag.frames.setBlocking(diag.frames.getBlocking() + 1);
        diag.seen.setBlocking(`${tflite.state}/${resizerState.state}`);
        const loaded = tflite.state === 'loaded' ? tflite.model : undefined;
        const resizer = resizerState.state === 'ready' ? resizerState.resizer : undefined;
        if (loaded == null || resizer == null) {
          diag.notReady.setBlocking(diag.notReady.getBlocking() + 1);
          return;
        }

        stage = 'size';
        const upright = uprightSize(frame.width, frame.height, frame.orientation);
        // Ön kamera: tampon aynalanmamış ama önizleme aynalıysa kutuları çevir.
        const mirrored = frame.isMirrored;

        stage = 'resize';
        const resized = resizer.resize(frame);
        let input: ArrayBuffer;
        try {
          stage = 'copy';
          // Resizer çıktısını dispose'dan ÖNCE kopyala; kopya tam boyutlu ve bağımsızdır.
          input = new Uint8Array(resized.getPixelBuffer()).slice().buffer;
        } finally {
          resized.dispose();
        }

        if (diagnosticsEnabled && diag.frames.getBlocking() % 20 === 0) {
          stage = 'thumb';
          // Modelin GÖRDÜĞÜ görüntü (yön, siyah bantlar, ters/yan dönme buradan anlaşılır).
          scheduleOnRN(
            publishThumb,
            rgbToBmpDataUri(new Uint8Array(input), model.inputSize.width, model.inputSize.height, 60, 60),
          );
        }

        stage = 'inference';
        const outputs = loaded.runSync([input]);

        stage = 'decode';
        const best = model.decode(outputs, { scoreThreshold: 0, maxResults: 1 })[0];
        diag.topScore.setBlocking(best != null ? best.score : -1);
        if (best != null) {
          diag.best.setBlocking(
            `best ${best.label} model-space x=${best.box.x.toFixed(2)} y=${best.box.y.toFixed(2)} ` +
              `w=${best.box.width.toFixed(2)} h=${best.box.height.toFixed(2)}`,
          );
        }
        const detections: Detection[] = model
          .decode(outputs, { scoreThreshold, maxResults })
          .map((d) => {
            const r = modelRectToFrameRect(d.box, upright, model.inputSize);
            const x1 = clamp01(r.x);
            const y1 = clamp01(r.y);
            const x2 = clamp01(r.x + r.width);
            const y2 = clamp01(r.y + r.height);
            const box = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
            return {
              label: d.label,
              score: d.score,
              box: mirrored ? mirrorRect(box) : box,
            };
          });
        diag.lastCount.setBlocking(detections.length);

        diag.meta.setBlocking(
          `frame ${frame.width}x${frame.height} ${frame.orientation} mir=${frame.isMirrored ? 1 : 0}`,
        );

        stage = 'publish';
        scheduleOnRN(publish, {
          detections,
          frameWidth: upright.width,
          frameHeight: upright.height,
        });
        diag.done.setBlocking(diag.done.getBlocking() + 1);
      } catch (e) {
        const message = `${stage}: ${describeError(e)}`;
        try {
          diag.errors.setBlocking(diag.errors.getBlocking() + 1);
          diag.lastError.setBlocking(message);
        } catch {
          // Tanı yazılamazsa çökmeyelim.
        }
        try {
          scheduleOnRN(reportError, message);
        } catch {
          // Bildirim de başarısız olursa en azından çökmeyelim.
        }
      } finally {
        try {
          frame.dispose();
        } catch {
          // Kare zaten serbest bırakılmış olabilir.
        }
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
      const lastError = diag.lastError.getBlocking();
      setDiagnostics(
        [
          `js: model=${tfliteState} resizer=${resizerStateName}`,
          `worklet sees: ${diag.seen.getBlocking() || '-'}`,
          `frames=${diag.frames.getBlocking()} notReady=${diag.notReady.getBlocking()} errors=${diag.errors.getBlocking()}`,
          `done=${diag.done.getBlocking()} jsReceived=${jsReceived.current}`,
          `detections=${diag.lastCount.getBlocking()} topScore=${diag.topScore.getBlocking().toFixed(2)}`,
          diag.meta.getBlocking(),
          diag.best.getBlocking(),
          modelInfo,
          lastError ? `ERR ${lastError}` : '',
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
  return { status, error, outputs: [frameOutput], result, labels: model.labels, diagnostics, diagnosticsImage };
}
