import type { NormalizedRect } from './types';

/** İki kutunun kesişim alanı (normalize birim²). */
export function intersectionArea(a: NormalizedRect, b: NormalizedRect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

/** İki kutunun kesişim / birleşim oranı (0..1). */
export function iou(a: NormalizedRect, b: NormalizedRect): number {
  const inter = intersectionArea(a, b);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}
