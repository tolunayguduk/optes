import type { DecodeOptions, RawDetection } from '../engines/tflite/types';
import { COCO_LABELS } from './cocoLabels';

/**
 * coco_ssd_mobilenet_v1_quant çıktı çözücü (ayrı dosya: birim testi `.tflite` asset'i yüklemesin).
 * Çıktı düzeni için bkz. `cocoSsdMobilenetV1.ts`.
 */
const LABEL_OFFSET = 1;

/** Çıktı tensörlerini çözer. Ayrı export edildi ki birim testi yazılabilsin. */
export function decodeCocoSsd(outputs: ArrayBuffer[], options: DecodeOptions): RawDetection[] {
  'worklet';
  const boxes = new Float32Array(outputs[0]!);
  const classes = new Float32Array(outputs[1]!);
  const scores = new Float32Array(outputs[2]!);
  const count = Math.min(Math.round(new Float32Array(outputs[3]!)[0] ?? 0), scores.length);

  const result: RawDetection[] = [];
  for (let i = 0; i < count && result.length < options.maxResults; i++) {
    const score = scores[i]!;
    if (score < options.scoreThreshold) continue;
    const label = COCO_LABELS[Math.round(classes[i]!) + LABEL_OFFSET];
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
