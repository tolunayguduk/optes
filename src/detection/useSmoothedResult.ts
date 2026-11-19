import { useEffect, useMemo, useRef, useState } from 'react';

import { createTracker, type TrackerOptions } from './tracker';
import type { Detection, DetectionFrame } from './types';

const PRUNE_INTERVAL_MS = 120;

/**
 * Ham tespit akışını kareler arası izleyerek yumuşatır (bkz. `createTracker`).
 * Motordan bağımsızdır: her `ObjectDetector.result` ile kullanılabilir.
 */
export function useSmoothedResult(
  result: DetectionFrame | null,
  options?: TrackerOptions,
): DetectionFrame | null {
  const tracker = useMemo(() => createTracker(options), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [smoothed, setSmoothed] = useState<DetectionFrame | null>(null);
  const frameSize = useRef<{ w: number; h: number; f2c: DetectionFrame['frameToCamera'] } | null>(
    null,
  );

  useEffect(() => {
    if (result == null) return;
    frameSize.current = { w: result.frameWidth, h: result.frameHeight, f2c: result.frameToCamera };
    setSmoothed({
      detections: tracker.update(result.detections, Date.now()),
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      frameToCamera: result.frameToCamera,
    });
  }, [result, tracker]);

  // Yeni sonuç gelmese de (ör. kamera durdu) süresi dolan kutular kaybolsun.
  useEffect(() => {
    const id = setInterval(() => {
      const size = frameSize.current;
      if (size == null) return;
      const next = tracker.prune(Date.now());
      setSmoothed((prev) => {
        if (prev == null || sameSet(prev.detections, next)) return prev;
        return { detections: next, frameWidth: size.w, frameHeight: size.h, frameToCamera: size.f2c };
      });
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tracker]);

  return smoothed;
}

function sameSet(a: Detection[], b: Detection[]): boolean {
  return a.length === b.length;
}
