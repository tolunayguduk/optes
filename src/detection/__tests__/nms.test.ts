import { suppressOverlaps } from '../nms';
import type { Detection } from '../types';

const det = (label: string, x: number, y: number, w: number, h: number, score: number): Detection => ({
  label,
  score,
  box: { x, y, width: w, height: h },
});

describe('suppressOverlaps', () => {
  it('aynı nesne üzerindeki yüksek örtüşmeli iki kutudan düşük skorluyu atar', () => {
    const out = suppressOverlaps([
      det('bottle', 0.4, 0.2, 0.2, 0.5, 0.6),
      det('bottle', 0.41, 0.21, 0.2, 0.5, 0.7),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.score).toBe(0.7);
  });

  it('farklı etiketli ama aynı nesneyi saran kutulardan yüksek skorluyu tutar (cup/bowl)', () => {
    const out = suppressOverlaps([
      det('bowl', 0.3, 0.3, 0.3, 0.3, 0.52),
      det('cup', 0.3, 0.31, 0.3, 0.3, 0.6),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.label).toBe('cup');
  });

  it('aynı etiketli büyük kutunun içinde kalan küçük kutuyu atar', () => {
    const out = suppressOverlaps([
      det('person', 0.1, 0.1, 0.6, 0.8, 0.7),
      det('person', 0.2, 0.2, 0.2, 0.3, 0.55), // tamamen içinde, IoU düşük
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.score).toBe(0.7);
  });

  it('farklı etiketli iç içe nesneyi korur (masanın üstündeki fincan)', () => {
    const out = suppressOverlaps([
      det('dining table', 0.0, 0.4, 1.0, 0.5, 0.8),
      det('cup', 0.4, 0.5, 0.1, 0.1, 0.6), // masanın içinde, farklı etiket
    ]);
    expect(out).toHaveLength(2);
  });

  it('birbirinden ayrı nesneleri korur', () => {
    const out = suppressOverlaps([
      det('person', 0.0, 0.1, 0.3, 0.8, 0.7),
      det('person', 0.5, 0.1, 0.3, 0.8, 0.6),
    ]);
    expect(out).toHaveLength(2);
  });

  it('sonucu skora göre azalan sırada döner ve girdiyi değiştirmez', () => {
    const input = [det('a', 0, 0, 0.1, 0.1, 0.5), det('b', 0.5, 0.5, 0.1, 0.1, 0.9)];
    const copy = JSON.stringify(input);
    const out = suppressOverlaps(input);
    expect(out.map((d) => d.label)).toEqual(['b', 'a']);
    expect(JSON.stringify(input)).toBe(copy);
  });
});
