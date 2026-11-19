import { bytesToBase64, rgbToBmpDataUri } from '../debugImage';

describe('bytesToBase64', () => {
  it('standart base64 ile aynı sonucu verir (dolgu dahil)', () => {
    for (const s of ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar']) {
      const bytes = Uint8Array.from(Buffer.from(s));
      expect(bytesToBase64(bytes)).toBe(Buffer.from(s).toString('base64'));
    }
  });
  it('tüm bayt değerlerinde Buffer ile uyuşur', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
  });
});

describe('rgbToBmpDataUri', () => {
  it('geçerli bir 24 bit BMP başlığı üretir', () => {
    // 4x4 görüntü -> 4x4 çıktı (4*3=12 bayt satır, 4'ün katı)
    const rgb = new Uint8Array(4 * 4 * 3);
    const uri = rgbToBmpDataUri(rgb, 4, 4, 4, 4);
    expect(uri.startsWith('data:image/bmp;base64,')).toBe(true);
    const bmp = Buffer.from(uri.split(',')[1]!, 'base64');
    expect(bmp.toString('ascii', 0, 2)).toBe('BM');
    expect(bmp.readUInt32LE(2)).toBe(54 + 4 * 4 * 3);
    expect(bmp.readInt32LE(18)).toBe(4);
    expect(bmp.readInt32LE(22)).toBe(4);
    expect(bmp.readUInt16LE(28)).toBe(24);
  });

  it('renkleri BGR sırasıyla ve satırları alttan üste yazar', () => {
    // 4x4: üst-sol piksel kırmızı (255,0,0), alt-sağ piksel mavi (0,0,255)
    const rgb = new Uint8Array(4 * 4 * 3);
    rgb[0] = 255; // (0,0) R
    const last = (3 * 4 + 3) * 3;
    rgb[last + 2] = 255; // (3,3) B
    const bmp = Buffer.from(rgbToBmpDataUri(rgb, 4, 4, 4, 4).split(',')[1]!, 'base64');
    // BMP'de ilk veri satırı görüntünün ALT satırıdır: alt-sol piksel siyah, alt-sağ (x=3) mavi (B=255)
    const bottomRight = 54 + 3 * 3;
    expect([bmp[bottomRight], bmp[bottomRight + 1], bmp[bottomRight + 2]]).toEqual([255, 0, 0]);
    // Son veri satırı görüntünün ÜST satırıdır: üst-sol piksel kırmızı (R=255 -> BGR'de son bayt)
    const topLeft = 54 + 3 * 12;
    expect([bmp[topLeft], bmp[topLeft + 1], bmp[topLeft + 2]]).toEqual([0, 0, 255]);
  });

  it('kaynağı en yakın komşuyla küçültür', () => {
    // 8x8 tamamı yeşil -> 4x4
    const rgb = new Uint8Array(8 * 8 * 3);
    for (let i = 0; i < 64; i++) rgb[i * 3 + 1] = 200;
    const bmp = Buffer.from(rgbToBmpDataUri(rgb, 8, 8, 4, 4).split(',')[1]!, 'base64');
    expect(bmp.readInt32LE(18)).toBe(4);
    expect(bmp[54 + 1]).toBe(200);
  });
});
