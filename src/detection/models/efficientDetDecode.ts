import type { DecodeOptions, RawDetection } from '../engines/tflite/types';
import { EFFICIENTDET_LABELS } from './efficientDetLabels';

/**
 * EfficientDet-Lite0 çıktı çözücü (ayrı dosya: birim testi `.tflite` asset'i yüklemesin).
 *
 * Model yerleşik NMS yapar ve dört float32 çıktı verir: kutular [1,N,4] (ymin,xmin,ymax,xmax; 0..1),
 * sınıflar [1,N], skorlar [1,N], adet [1]. Dosyadaki çıktı SIRASI üstverisinden güvenilir okunamadığı için
 * (ve sürümler arasında değişebildiği için) çıktılar sıraya değil ŞEKİL ve DEĞERLERE göre tanınır:
 *  - kutular: en uzun tensör (N*4), adet: tek elemanlı tensör,
 *  - kalan ikisinden tüm değerleri 0..1 aralığında olan skorlardır; ikisi de öyleyse (ör. tüm sınıflar 0/1)
 *    belgelenmiş sıraya (skorlar sınıflardan önce gelir) başvurulur.
 */
export function decodeEfficientDet(outputs: ArrayBuffer[], options: DecodeOptions): RawDetection[] {
  'worklet';
  const arrays = outputs.map((o) => new Float32Array(o));
  if (arrays.length < 4) return [];

  let boxesIdx = 0;
  let countIdx = 0;
  for (let i = 1; i < arrays.length; i++) {
    if (arrays[i]!.length > arrays[boxesIdx]!.length) boxesIdx = i;
    if (arrays[i]!.length < arrays[countIdx]!.length) countIdx = i;
  }
  const rest: number[] = [];
  for (let i = 0; i < arrays.length; i++) {
    if (i !== boxesIdx && i !== countIdx) rest.push(i);
  }
  if (rest.length !== 2) return [];

  const inUnitRange = (a: Float32Array) => {
    for (let i = 0; i < a.length; i++) {
      if (!(a[i]! >= 0 && a[i]! <= 1)) return false;
    }
    return true;
  };
  const first = rest[0]!;
  const second = rest[1]!;
  let scoresIdx = first; // belgelenmiş sıra: skorlar önce
  let classesIdx = second;
  if (!inUnitRange(arrays[first]!) && inUnitRange(arrays[second]!)) {
    scoresIdx = second;
    classesIdx = first;
  }

  const boxes = arrays[boxesIdx]!;
  const classes = arrays[classesIdx]!;
  const scores = arrays[scoresIdx]!;
  const count = Math.min(Math.round(arrays[countIdx]![0] ?? 0), scores.length);

  const result: RawDetection[] = [];
  for (let i = 0; i < count && result.length < options.maxResults; i++) {
    const score = scores[i]!;
    if (score < options.scoreThreshold) continue;
    const label = EFFICIENTDET_LABELS[Math.round(classes[i]!)];
    if (label == null || label === '???') continue;

    const ymin = boxes[i * 4]!;
    const xmin = boxes[i * 4 + 1]!;
    const ymax = boxes[i * 4 + 2]!;
    const xmax = boxes[i * 4 + 3]!;
    result.push({
      label,
      score,
      box: { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin },
    });
  }
  return result;
}
