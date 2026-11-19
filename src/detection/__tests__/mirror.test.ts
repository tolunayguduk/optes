import { mirrorRect } from '../geometry';

describe('mirrorRect', () => {
  it('kutuyu yatay eksende aynalar', () => {
    const out = mirrorRect({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
    expect(out.x).toBeCloseTo(0.6); // 1 - 0.1 - 0.3
    expect(out.y).toBeCloseTo(0.2);
    expect(out.width).toBeCloseTo(0.3);
    expect(out.height).toBeCloseTo(0.4);
  });

  it('iki kez uygulamak kutuyu eski haline getirir', () => {
    const r = { x: 0.25, y: 0.5, width: 0.125, height: 0.25 };
    const twice = mirrorRect(mirrorRect(r));
    expect(twice.x).toBeCloseTo(r.x);
    expect(twice.width).toBeCloseTo(r.width);
  });

  it('ekranı kaplayan kutu aynalanınca aynı kalır', () => {
    const out = mirrorRect({ x: 0, y: 0, width: 1, height: 1 });
    expect(out.x).toBeCloseTo(0);
    expect(out.width).toBeCloseTo(1);
  });
});
