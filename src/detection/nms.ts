import { intersectionArea, iou } from './boxMath';
import type { Detection } from './types';

export interface SuppressOptions {
  /** Bu IoU ve üstündeki kutular (etiketten bağımsız) aynı nesnenin tekrarı sayılır. Varsayılan 0.5. */
  iou?: number;
  /**
   * AYNI etiketli iki kutudan küçüğünün bu oranı ve fazlası büyüğün içindeyse tekrar sayılır
   * (ör. aynı şişenin içindeki ikinci "bottle" kutusu). Farklı etiketler için UYGULANMAZ:
   * masa içindeki fincan gibi gerçek iç içe nesneler korunmalı. Varsayılan 0.8.
   */
  containment?: number;
}

/**
 * Tekrarlayan tespitleri eler: skora göre sıralayıp, daha yüksek skorlu bir kutuyla fazla örtüşeni atar.
 * Sonuç skora göre azalan sıradadır.
 */
export function suppressOverlaps(detections: Detection[], options: SuppressOptions = {}): Detection[] {
  const iouThreshold = options.iou ?? 0.5;
  const containment = options.containment ?? 0.8;

  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of sorted) {
    const isDuplicate = kept.some((k) => {
      if (iou(k.box, d.box) >= iouThreshold) return true;
      if (k.label !== d.label) return false;
      const smaller = Math.min(k.box.width * k.box.height, d.box.width * d.box.height);
      return smaller > 0 && intersectionArea(k.box, d.box) / smaller >= containment;
    });
    if (!isDuplicate) kept.push(d);
  }
  return kept;
}
