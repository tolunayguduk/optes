/**
 * Yüzü hizalayıp 112x112 modele hazırlama (ArcFace tarzı göz hizalaması).
 * Worklet thread'inde çalışacak şekilde yazıldı (yalnızca saf veri).
 */

export const FACE_SIZE = 112;

/** ArcFace 112x112 şablonunda gözlerin konumu (görüntünün solundaki / sağındaki göz). */
export const TEMPLATE_LEFT_EYE = { x: 38.2946, y: 51.6963 };
export const TEMPLATE_RIGHT_EYE = { x: 73.5318, y: 51.5014 };

export interface Point {
  x: number;
  y: number;
}

/** Çıktı (u, v) -> kaynak (x, y):  x = a*u + b*v + c,  y = d*u + e*v + f */
export interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Şablon gözlerini kaynak gözlere taşıyan benzerlik dönüşümü (ölçek + döndürme + öteleme).
 * Gözlerin hangisinin "sol" olduğu önemli değildir; görüntüde solda olan sol göz sayılır.
 */
export function eyeAlignment(eyeA: Point, eyeB: Point): Affine {
  'worklet';
  const left = eyeA.x <= eyeB.x ? eyeA : eyeB;
  const right = eyeA.x <= eyeB.x ? eyeB : eyeA;

  const tdx = TEMPLATE_RIGHT_EYE.x - TEMPLATE_LEFT_EYE.x;
  const tdy = TEMPLATE_RIGHT_EYE.y - TEMPLATE_LEFT_EYE.y;
  const sdx = right.x - left.x;
  const sdy = right.y - left.y;

  const scale = Math.hypot(sdx, sdy) / Math.hypot(tdx, tdy);
  const angle = Math.atan2(sdy, sdx) - Math.atan2(tdy, tdx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const a = scale * cos;
  const b = -scale * sin;
  const d = scale * sin;
  const e = scale * cos;
  const c = left.x - (a * TEMPLATE_LEFT_EYE.x + b * TEMPLATE_LEFT_EYE.y);
  const f = left.y - (d * TEMPLATE_LEFT_EYE.x + e * TEMPLATE_LEFT_EYE.y);
  return { a, b, c, d, e, f };
}

/**
 * Kaynak RGB görüntüsünden (interleaved, uint8) `affine` ile 112x112 yüz kırpıp çıktı tensörüne yazar:
 * NCHW düzeninde [3, 112, 112], değerler 0..1, RGB. Çift doğrusal (bilinear) örnekleme; kaynak dışı = siyah.
 * `flip` true ise yatay aynalanmış kırpma üretir (model için ikinci görüntü).
 */
export function warpFaceToTensor(
  rgb: Uint8Array,
  srcW: number,
  srcH: number,
  affine: Affine,
  flip: boolean,
): Float32Array<ArrayBuffer> {
  'worklet';
  const size = FACE_SIZE;
  const plane = size * size;
  const out = new Float32Array(3 * plane);

  for (let v = 0; v < size; v++) {
    for (let uOut = 0; uOut < size; uOut++) {
      const u = flip ? size - 1 - uOut : uOut;
      const sx = affine.a * u + affine.b * v + affine.c;
      const sy = affine.d * u + affine.e * v + affine.f;

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const idx = v * size + uOut;

      for (let ch = 0; ch < 3; ch++) {
        let acc = 0;
        for (let dy = 0; dy <= 1; dy++) {
          for (let dx = 0; dx <= 1; dx++) {
            const px = x0 + dx;
            const py = y0 + dy;
            if (px < 0 || py < 0 || px >= srcW || py >= srcH) continue;
            const wgt = (dx === 0 ? 1 - fx : fx) * (dy === 0 ? 1 - fy : fy);
            acc += wgt * rgb[(py * srcW + px) * 3 + ch]!;
          }
        }
        out[ch * plane + idx] = acc / 255;
      }
    }
  }
  return out;
}
