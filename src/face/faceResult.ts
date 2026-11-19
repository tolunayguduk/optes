import type { DetectionFrame } from '../detection/types';
import { DEFAULT_MATCH_THRESHOLD, matchFace, type Person } from './gallery';
import type { FaceFrame } from './types';

export const UNKNOWN_LABEL = 'Bilinmeyen';
export const GENERIC_FACE_LABEL = 'Yüz';

/**
 * Yüz gözlemlerini, nesne tespitiyle aynı çizim hattında (takip, overlay) kullanılabilen `DetectionFrame`'e çevirir.
 * Etiket eşleşen kişinin adıdır; skor olarak kosinüs benzerliği gösterilir (eşik ayarı için görünür kalır).
 * Hiç kayıtlı kişi yoksa genel "Yüz" etiketi ve bulucu güveni kullanılır.
 */
export function facesToDetectionFrame(
  frame: FaceFrame | null,
  people: readonly Person[],
  threshold: number = DEFAULT_MATCH_THRESHOLD,
): DetectionFrame | null {
  if (frame == null) return null;
  return {
    frameWidth: frame.frameWidth,
    frameHeight: frame.frameHeight,
    detections: frame.faces.map((face) => {
      if (people.length === 0) {
        return { label: GENERIC_FACE_LABEL, score: face.detScore, box: face.box };
      }
      const m = matchFace(face.embedding, people, threshold);
      return {
        label: m.name ?? UNKNOWN_LABEL,
        score: Math.max(0, Math.min(1, m.similarity)),
        box: face.box,
      };
    }),
  };
}
