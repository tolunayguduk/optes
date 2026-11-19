import { createTracker, iou } from '../tracker';
import type { Detection } from '../types';

const det = (label: string, x: number, y: number, w = 0.2, h = 0.2, score = 0.8): Detection => ({
  label,
  score,
  box: { x, y, width: w, height: h },
});

describe('iou', () => {
  it('aynı kutu için 1, ayrık kutular için 0 verir', () => {
    const a = { x: 0, y: 0, width: 0.5, height: 0.5 };
    expect(iou(a, a)).toBeCloseTo(1);
    expect(iou(a, { x: 0.6, y: 0.6, width: 0.2, height: 0.2 })).toBe(0);
  });
  it('yarım örtüşmede doğru oranı verir', () => {
    const a = { x: 0, y: 0, width: 1, height: 1 };
    const b = { x: 0.5, y: 0, width: 1, height: 1 };
    expect(iou(a, b)).toBeCloseTo(1 / 3);
  });
});

describe('createTracker', () => {
  it('ilk karedeki tespiti hemen göstermez (hayalet filtresi), ikinci karede gösterir', () => {
    const t = createTracker();
    expect(t.update([det('cup', 0.3, 0.3)], 0)).toHaveLength(0);
    expect(t.update([det('cup', 0.3, 0.3)], 100)).toHaveLength(1);
  });

  it('titreyen kutuyu yumuşatır: çıktı hamdan daha az oynar', () => {
    const t = createTracker();
    const raw: number[] = [];
    const out: number[] = [];
    for (let i = 0; i < 20; i++) {
      const jitter = i % 2 === 0 ? 0.02 : -0.02;
      const d = det('cup', 0.4 + jitter, 0.4);
      raw.push(d.box.x);
      const res = t.update([d], i * 33);
      if (res[0]) out.push(res[0].box.x);
    }
    const range = (a: number[]) => Math.max(...a) - Math.min(...a);
    expect(range(out.slice(5))).toBeLessThan(range(raw.slice(5)) * 0.6);
  });

  it('gerçek hareketi takip eder (gecikmeli de olsa hedefe yakınsar)', () => {
    const t = createTracker();
    let last = 0;
    for (let i = 0; i < 30; i++) {
      const res = t.update([det('cup', 0.2 + i * 0.01, 0.4)], i * 33);
      if (res[0]) last = res[0].box.x;
    }
    expect(Math.abs(last - (0.2 + 29 * 0.01))).toBeLessThan(0.06);
  });

  it('tek karelik yanlış etiket görünen etiketi değiştirmez', () => {
    const t = createTracker();
    let shown = '';
    for (let i = 0; i < 10; i++) {
      const label = i === 6 ? 'bowl' : 'cup';
      const res = t.update([det(label, 0.3, 0.3)], i * 33);
      if (res[0]) shown = res[0].label;
      if (i === 6) expect(shown).toBe('cup');
    }
    expect(shown).toBe('cup');
  });

  it('kalıcı etiket değişimini zamanla benimser', () => {
    const t = createTracker();
    let shown = '';
    for (let i = 0; i < 20; i++) {
      const label = i < 5 ? 'cup' : 'bowl';
      const res = t.update([det(label, 0.3, 0.3)], i * 33);
      if (res[0]) shown = res[0].label;
    }
    expect(shown).toBe('bowl');
  });

  it('bir an kaçan tespiti holdMs boyunca tutar, sonra kaldırır', () => {
    const t = createTracker({ holdMs: 350 });
    t.update([det('cup', 0.3, 0.3)], 0);
    t.update([det('cup', 0.3, 0.3)], 33);
    expect(t.update([], 100)).toHaveLength(1); // kaçtı ama tutuluyor
    expect(t.update([], 300)).toHaveLength(1);
    expect(t.update([], 500)).toHaveLength(0); // süre doldu
  });

  it('prune, yeni tespit gelmese de süresi dolanı eler', () => {
    const t = createTracker({ holdMs: 200 });
    t.update([det('cup', 0.3, 0.3)], 0);
    t.update([det('cup', 0.3, 0.3)], 33);
    expect(t.prune(100)).toHaveLength(1);
    expect(t.prune(400)).toHaveLength(0);
  });

  it('birbirinden uzak iki nesneyi ayrı izler', () => {
    const t = createTracker();
    const frame = () => [det('cup', 0.05, 0.1), det('book', 0.7, 0.6)];
    t.update(frame(), 0);
    const res = t.update(frame(), 33);
    expect(res.map((d) => d.label).sort()).toEqual(['book', 'cup']);
  });
});

describe('createTracker + tekrar eleme', () => {
  it('aynı karedeki aynı nesnenin iki kutusundan yalnızca biri izlenir', () => {
    const t = createTracker();
    const frame = () => [det('bottle', 0.4, 0.2, 0.2, 0.5, 0.7), det('bottle', 0.41, 0.21, 0.2, 0.5, 0.6)];
    t.update(frame(), 0);
    expect(t.update(frame(), 33)).toHaveLength(1);
  });

  it('eski kareden kalan parça kutu, tam kutuyla örtüşünce gösterilmez', () => {
    const t = createTracker({ holdMs: 350 });
    // önce yalnızca parça kutu görülüyor (iki kare)
    t.update([det('bottle', 0.4, 0.2, 0.2, 0.15, 0.6)], 0);
    t.update([det('bottle', 0.4, 0.2, 0.2, 0.15, 0.6)], 33);
    // sonra tam kutu geliyor; parça, tam kutunun içinde kalıyor
    t.update([det('bottle', 0.4, 0.2, 0.2, 0.5, 0.8)], 66);
    const shown = t.update([det('bottle', 0.4, 0.2, 0.2, 0.5, 0.8)], 99);
    expect(shown).toHaveLength(1);
    expect(shown[0]!.box.height).toBeGreaterThan(0.3);
  });
});
