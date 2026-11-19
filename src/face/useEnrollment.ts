import { useCallback, useEffect, useRef, useState } from 'react';

import type { Person } from './gallery';
import type { FaceFrame, FaceObservation } from './types';

/** Bir kişiyi kaydetmek için toplanan yüz örneği sayısı (~1 sn). */
export const ENROLLMENT_SAMPLES = 5;

/** En büyük (kameraya en yakın) yüzü seçer; kayıt sırasında kadrajdaki asıl kişi odur. */
export function largestFace(frame: FaceFrame): FaceObservation | null {
  let best: FaceObservation | null = null;
  for (const f of frame.faces) {
    if (best == null || f.box.width * f.box.height > best.box.width * best.box.height) best = f;
  }
  return best;
}

/**
 * Kayıt akışı: `start(ad)` çağrılınca en büyük yüzden `ENROLLMENT_SAMPLES` örnek toplanır ve kişi eklenir.
 * Veri yalnızca bellekte tutulur (kalıcı depolama henüz yok).
 */
export function useEnrollment(frame: FaceFrame | null, onEnrolled: (person: Person) => void) {
  const [state, setState] = useState<{ name: string; samples: number[][] } | null>(null);
  const lastSeq = useRef(-1);

  useEffect(() => {
    if (state == null || frame == null || frame.seq === lastSeq.current) return;
    lastSeq.current = frame.seq;
    const face = largestFace(frame);
    if (face == null) return;
    const samples = [...state.samples, face.embedding];
    if (samples.length >= ENROLLMENT_SAMPLES) {
      onEnrolled({ name: state.name, embeddings: samples });
      setState(null);
    } else {
      setState({ name: state.name, samples });
    }
  }, [frame, state, onEnrolled]);

  const start = useCallback((name: string) => setState({ name, samples: [] }), []);
  const cancel = useCallback(() => setState(null), []);

  return {
    enrolling: state != null,
    name: state?.name ?? null,
    progress: state?.samples.length ?? 0,
    total: ENROLLMENT_SAMPLES,
    start,
    cancel,
  };
}
