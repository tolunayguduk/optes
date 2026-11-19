/**
 * Hata ayıklama: modelin gördüğü görüntüyü (RGB, HWC, uint8) küçük bir BMP'ye çevirip data URI verir.
 * Worklet thread'inde çalışacak şekilde yazıldı (yalnızca saf veri, harici bağımlılık yok).
 */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Bayt dizisini base64 metnine çevirir (btoa her worklet runtime'ında olmayabilir). */
export function bytesToBase64(bytes: Uint8Array): string {
  'worklet';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    out += B64[b0 >> 2]!;
    out += B64[((b0 & 3) << 4) | (b1 >> 4)]!;
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)]! : '=';
    out += i + 2 < bytes.length ? B64[b2 & 63]! : '=';
  }
  return out;
}

/**
 * `rgb` (srcW x srcH, interleaved RGB) görüntüsünü en yakın komşuyla outW x outH'ye küçültüp
 * 24 bit BMP data URI döndürür. `outW * 3` 4'ün katı olmalıdır (satır dolgusu gerekmesin), örn. 60.
 */
export function rgbToBmpDataUri(
  rgb: Uint8Array,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
): string {
  'worklet';
  const rowBytes = outW * 3;
  const imageSize = rowBytes * outH;
  const fileSize = 54 + imageSize;
  const bmp = new Uint8Array(fileSize);
  const put32 = (offset: number, v: number) => {
    bmp[offset] = v & 255;
    bmp[offset + 1] = (v >> 8) & 255;
    bmp[offset + 2] = (v >> 16) & 255;
    bmp[offset + 3] = (v >> 24) & 255;
  };
  bmp[0] = 0x42; // 'B'
  bmp[1] = 0x4d; // 'M'
  put32(2, fileSize);
  put32(10, 54); // piksel verisi ofseti
  put32(14, 40); // DIB başlık boyu
  put32(18, outW);
  put32(22, outH); // pozitif: satırlar alttan üste
  bmp[26] = 1; // düzlem
  bmp[28] = 24; // bit/piksel
  put32(34, imageSize);
  for (let y = 0; y < outH; y++) {
    const srcY = Math.min(srcH - 1, Math.floor(((y + 0.5) * srcH) / outH));
    const dstRow = 54 + (outH - 1 - y) * rowBytes;
    for (let x = 0; x < outW; x++) {
      const srcX = Math.min(srcW - 1, Math.floor(((x + 0.5) * srcW) / outW));
      const s = (srcY * srcW + srcX) * 3;
      const d = dstRow + x * 3;
      bmp[d] = rgb[s + 2]!; // B
      bmp[d + 1] = rgb[s + 1]!; // G
      bmp[d + 2] = rgb[s]!; // R
    }
  }
  return `data:image/bmp;base64,${bytesToBase64(bmp)}`;
}
