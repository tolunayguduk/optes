/**
 * BlazeFace (short range, 128x128) anchor merkezleri.
 *
 * MediaPipe'ın SSD anchor üreticisinin bu model yapılandırmasıyla üretimi: 4 katman, adımlar [8, 16, 16, 16],
 * `fixed_anchor_size` (anchor genişlik/yüksekliği 1 sayılır) ve her konumda 2 anchor (temel + interpolasyonlu).
 * Aynı adımlı ardışık katmanlar tek bir özellik haritasında birleştirilir:
 *   adım 8  -> 16x16 harita x 2 anchor            = 512
 *   adım 16 -> 8x8 harita x (3 katman x 2 anchor) = 384        toplam 896
 * Dönen dizi [x0, y0, x1, y1, ...] biçimindedir (normalize merkezler, 0..1).
 */
export const BLAZEFACE_INPUT_SIZE = 128;
export const BLAZEFACE_ANCHOR_COUNT = 896;

export function generateBlazeFaceAnchors(): Float32Array {
  const strides = [8, 16, 16, 16];
  const numLayers = strides.length;
  const centers: number[] = [];

  let layerId = 0;
  while (layerId < numLayers) {
    let lastSameStride = layerId;
    let anchorsPerCell = 0;
    while (lastSameStride < numLayers && strides[lastSameStride] === strides[layerId]) {
      anchorsPerCell += 2; // 1 aspect oranı + 1 interpolasyonlu anchor
      lastSameStride += 1;
    }
    const featureMap = Math.ceil(BLAZEFACE_INPUT_SIZE / strides[layerId]!);
    for (let y = 0; y < featureMap; y++) {
      for (let x = 0; x < featureMap; x++) {
        for (let a = 0; a < anchorsPerCell; a++) {
          centers.push((x + 0.5) / featureMap, (y + 0.5) / featureMap);
        }
      }
    }
    layerId = lastSameStride;
  }
  return Float32Array.from(centers);
}
