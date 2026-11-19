import { BLAZEFACE_INPUT_SIZE } from './anchors';

/** BlazeFace tespiti; tüm değerler 128x128 "letterbox" girdi uzayında normalize (0..1). */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  /** 6 anahtar nokta: [x0,y0, x1,y1, ...] sırası: sağ göz, sol göz, burun ucu, ağız, sağ kulak, sol kulak (kişinin kendi yönünden). */
  keypoints: number[];
}

const NUM_KEYPOINTS = 6;
const VALUES_PER_ANCHOR = 4 + NUM_KEYPOINTS * 2; // 16

function sigmoid(x: number): number {
  'worklet';
  const c = Math.max(-100, Math.min(100, x));
  return 1 / (1 + Math.exp(-c));
}

function boxIou(a: FaceBox, b: FaceBox): number {
  'worklet';
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * BlazeFace çıktılarını çözer.
 * @param regressors [N, 16]: kutu merkezi/boyutu (anchor'a göre) ve 6 anahtar nokta
 * @param scores     [N]: ham logit (sigmoid uygulanır)
 * @param anchors    [N, 2]: anchor merkezleri (bkz. generateBlazeFaceAnchors)
 */
export function decodeBlazeFace(
  regressors: Float32Array,
  scores: Float32Array,
  anchors: Float32Array,
  scoreThreshold: number,
  nmsIou: number,
  maxFaces: number,
): FaceBox[] {
  'worklet';
  const scale = BLAZEFACE_INPUT_SIZE;
  const candidates: FaceBox[] = [];
  const count = Math.min(scores.length, anchors.length / 2, Math.floor(regressors.length / VALUES_PER_ANCHOR));

  for (let i = 0; i < count; i++) {
    const score = sigmoid(scores[i]!);
    if (score < scoreThreshold) continue;

    const ax = anchors[i * 2]!;
    const ay = anchors[i * 2 + 1]!;
    const base = i * VALUES_PER_ANCHOR;
    const cx = regressors[base]! / scale + ax;
    const cy = regressors[base + 1]! / scale + ay;
    const w = regressors[base + 2]! / scale;
    const h = regressors[base + 3]! / scale;

    const keypoints: number[] = [];
    for (let k = 0; k < NUM_KEYPOINTS; k++) {
      keypoints.push(regressors[base + 4 + k * 2]! / scale + ax, regressors[base + 5 + k * 2]! / scale + ay);
    }
    candidates.push({ x: cx - w / 2, y: cy - h / 2, width: w, height: h, score, keypoints });
  }

  candidates.sort((a, b) => b.score - a.score);
  const kept: FaceBox[] = [];
  for (const c of candidates) {
    if (kept.length >= maxFaces) break;
    if (kept.every((k) => boxIou(k, c) < nmsIou)) kept.push(c);
  }
  return kept;
}
