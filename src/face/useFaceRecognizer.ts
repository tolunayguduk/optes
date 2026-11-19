import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useFrameOutput } from 'react-native-vision-camera';
import { type GPUFrame, useResizer } from 'react-native-vision-camera-resizer';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';

import { clamp01, modelRectToFrameRect, uprightSize } from '../detection/geometry';
import { eyeAlignment, warpFaceToTensor } from './align';
import { BLAZEFACE_ANCHOR_COUNT, BLAZEFACE_INPUT_SIZE, generateBlazeFaceAnchors } from './anchors';
import { decodeBlazeFace } from './blazeFace';
import { averageEmbeddings, l2Normalize } from './embedding';
import type { FaceFrame, FaceObservation, FaceRecognizer, FaceRecognizerOptions } from './types';

/** Yüz kırpması için yüksek çözünürlüklü kare boyutu (kare, "contain"); 3 MB/kare, bu yüzden ~5 kare/sn. */
const HI_RES = 1024;

function describeError(e: unknown): string {
  'worklet';
  if (e != null && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

/**
 * Yüz tanıma hattı (hepsi cihaz üzerinde):
 *   kare -> 128x128 küçük + 1024x1024 büyük kopya (GPU) -> BlazeFace (yüz + göz noktaları)
 *   -> göz hizalamalı 112x112 kırpma (büyük kopyadan) -> MobileFaceNet (128 boyutlu parmak izi).
 * Kamera iş parçacığında çalışır; sonuçlar React'e `scheduleOnRN` ile gider. Eşleştirme JS tarafındadır.
 *
 * DENEME (spike): modeller kişisel değerlendirme içindir; MobileFaceNet'in eğitim verisi/lisansı
 * yayından önce doğrulanmalıdır (bkz. docs/adr/0003-yuz-tanima.md).
 */
export function useFaceRecognizer(options: FaceRecognizerOptions = {}): FaceRecognizer {
  const minInterval = options.minIntervalMs ?? 200;
  const maxFaces = options.maxFaces ?? 3;
  const detThreshold = options.scoreThreshold ?? 0.6;
  const diagnosticsEnabled = options.diagnostics === true;

  const blaze = useTensorflowModel(require('../../assets/models/blaze_face_short_range.tflite'), []);
  const embedder = useTensorflowModel(require('../../assets/models/mobilefacenet.tflite'), []);
  const small = useResizer({
    width: BLAZEFACE_INPUT_SIZE,
    height: BLAZEFACE_INPUT_SIZE,
    channelOrder: 'rgb',
    dataType: 'uint8',
    pixelLayout: 'interleaved',
    scaleMode: 'contain',
  });
  const big = useResizer({
    width: HI_RES,
    height: HI_RES,
    channelOrder: 'rgb',
    dataType: 'uint8',
    pixelLayout: 'interleaved',
    scaleMode: 'contain',
  });
  const anchors = useMemo(() => generateBlazeFaceAnchors(), []);

  const diag = useMemo(
    () => ({
      frames: createSynchronizable(0),
      notReady: createSynchronizable(0),
      lastRun: createSynchronizable(0),
      processed: createSynchronizable(0),
      lastFaces: createSynchronizable(0),
      lastMs: createSynchronizable(0),
      errors: createSynchronizable(0),
      lastError: createSynchronizable(''),
    }),
    [],
  );

  const [frame, setFrame] = useState<FaceFrame | null>(null);
  const [diagnostics, setDiagnostics] = useState<string | undefined>(undefined);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const seq = useRef(0);

  const publish = useCallback((next: { faces: FaceObservation[]; frameWidth: number; frameHeight: number }) => {
    seq.current += 1;
    setFrame({ ...next, seq: seq.current });
    setRuntimeError(null);
  }, []);
  const reportError = useCallback((message: string) => setRuntimeError(message), []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    // Kareler fiziksel olarak dik gelsin (nesne tespitindeki gibi; koordinatlar karenin kendisi olsun).
    enablePhysicalBufferRotation: true,
    onFrame(frameIn) {
      'worklet';
      let stage = 'start';
      let smallFrame: GPUFrame | undefined;
      let bigFrame: GPUFrame | undefined;
      try {
        diag.frames.setBlocking(diag.frames.getBlocking() + 1);
        const now = Date.now();
        if (now - diag.lastRun.getBlocking() < minInterval) return;

        const detector = blaze.state === 'loaded' ? blaze.model : undefined;
        const embedModel = embedder.state === 'loaded' ? embedder.model : undefined;
        const smallResizer = small.state === 'ready' ? small.resizer : undefined;
        const bigResizer = big.state === 'ready' ? big.resizer : undefined;
        if (detector == null || embedModel == null || smallResizer == null || bigResizer == null) {
          diag.notReady.setBlocking(diag.notReady.getBlocking() + 1);
          return;
        }
        diag.lastRun.setBlocking(now);

        const upright = uprightSize(frameIn.width, frameIn.height, frameIn.orientation);

        stage = 'resize';
        smallFrame = smallResizer.resize(frameIn);
        bigFrame = bigResizer.resize(frameIn);

        // --- Yüz bulma (BlazeFace: girdi [-1, 1]) ---
        stage = 'detect';
        const smallBytes = new Uint8Array(smallFrame.getPixelBuffer());
        const detInput = new Float32Array(BLAZEFACE_INPUT_SIZE * BLAZEFACE_INPUT_SIZE * 3);
        for (let i = 0; i < detInput.length; i++) detInput[i] = (smallBytes[i]! - 127.5) / 127.5;
        const detOut = detector.runSync([detInput.buffer]);
        let regressors: Float32Array | undefined;
        let scores: Float32Array | undefined;
        for (const o of detOut) {
          const a = new Float32Array(o);
          if (a.length === BLAZEFACE_ANCHOR_COUNT * 16) regressors = a;
          else if (a.length === BLAZEFACE_ANCHOR_COUNT) scores = a;
        }
        if (regressors == null || scores == null) throw new Error('beklenmeyen BlazeFace çıktısı');
        const boxes = decodeBlazeFace(regressors, scores, anchors, detThreshold, 0.3, maxFaces);

        // --- Hizalama + parmak izi ---
        stage = 'embed';
        const faces: FaceObservation[] = [];
        if (boxes.length > 0) {
          const bigBytes = new Uint8Array(bigFrame.getPixelBuffer());
          for (const b of boxes) {
            const eyeA = { x: b.keypoints[0]! * HI_RES, y: b.keypoints[1]! * HI_RES };
            const eyeB = { x: b.keypoints[2]! * HI_RES, y: b.keypoints[3]! * HI_RES };
            const affine = eyeAlignment(eyeA, eyeB);
            const t1 = warpFaceToTensor(bigBytes, HI_RES, HI_RES, affine, false);
            const t2 = warpFaceToTensor(bigBytes, HI_RES, HI_RES, affine, true);
            const out = new Float32Array(embedModel.runSync([t1.buffer, t2.buffer])[0]!);
            const half = out.length / 2;
            const embedding = averageEmbeddings([
              l2Normalize(out.subarray(0, half)),
              l2Normalize(out.subarray(half)),
            ]);

            const r = modelRectToFrameRect(
              { x: b.x, y: b.y, width: b.width, height: b.height },
              upright,
              { width: BLAZEFACE_INPUT_SIZE, height: BLAZEFACE_INPUT_SIZE },
            );
            const x1 = clamp01(r.x);
            const y1 = clamp01(r.y);
            const x2 = clamp01(r.x + r.width);
            const y2 = clamp01(r.y + r.height);
            faces.push({
              box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
              detScore: b.score,
              embedding,
            });
          }
        }

        diag.lastFaces.setBlocking(faces.length);
        diag.lastMs.setBlocking(Date.now() - now);
        stage = 'publish';
        scheduleOnRN(publish, { faces, frameWidth: upright.width, frameHeight: upright.height });
        diag.processed.setBlocking(diag.processed.getBlocking() + 1);
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
          // Bildirim de başarısız olursa çökmeyelim.
        }
      } finally {
        try {
          smallFrame?.dispose();
        } catch {
          // zaten serbest
        }
        try {
          bigFrame?.dispose();
        } catch {
          // zaten serbest
        }
        try {
          frameIn.dispose();
        } catch {
          // zaten serbest
        }
      }
    },
  });

  const blazeState = blaze.state;
  const embedState = embedder.state;
  const smallState = small.state;
  const bigState = big.state;
  useEffect(() => {
    if (!diagnosticsEnabled) return;
    const id = setInterval(() => {
      const lastError = diag.lastError.getBlocking();
      setDiagnostics(
        [
          `yüz: blaze=${blazeState} embed=${embedState} resize=${smallState}/${bigState}`,
          `frames=${diag.frames.getBlocking()} notReady=${diag.notReady.getBlocking()} işlenen=${diag.processed.getBlocking()}`,
          `son: yüz=${diag.lastFaces.getBlocking()} süre=${diag.lastMs.getBlocking()}ms errors=${diag.errors.getBlocking()}`,
          lastError ? `ERR ${lastError}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }, 500);
    return () => clearInterval(id);
  }, [diagnosticsEnabled, diag, blazeState, embedState, smallState, bigState]);

  let status: FaceRecognizer['status'] = 'ready';
  let error: Error | undefined;
  if (blaze.state === 'error') {
    status = 'error';
    error = blaze.error;
  } else if (embedder.state === 'error') {
    status = 'error';
    error = embedder.error;
  } else if (small.state === 'error') {
    status = 'error';
    error = small.error;
  } else if (big.state === 'error') {
    status = 'error';
    error = big.error;
  } else if (runtimeError != null) {
    status = 'error';
    error = new Error(runtimeError);
  } else if (
    blaze.state === 'loading' ||
    embedder.state === 'loading' ||
    small.state === 'loading' ||
    big.state === 'loading'
  ) {
    status = 'loading';
  }

  return { status, error, outputs: [frameOutput], frame, diagnostics };
}
