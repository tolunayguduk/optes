import { decodeEfficientDet } from '../models/efficientDetDecode';

const N = 25;
const f32 = (values: number[], length: number): ArrayBuffer => {
  const a = new Float32Array(length);
  values.forEach((v, i) => (a[i] = v));
  return a.buffer;
};

/** İki tespit: (person, 0.9, kutu A) ve (cup, 0.7, kutu B). */
function tensors() {
  const boxes = f32(
    [
      0.1, 0.2, 0.5, 0.6, // ymin,xmin,ymax,xmax
      0.3, 0.4, 0.4, 0.5,
    ],
    N * 4,
  );
  const classes = f32([0, 46], N); // 0 = person, 46 = cup (labelmap'te 0 tabanlı)
  const scores = f32([0.9, 0.7], N);
  const count = f32([2], 1);
  return { boxes, classes, scores, count };
}

const options = { scoreThreshold: 0.5, maxResults: 20 };

describe('decodeEfficientDet', () => {
  it('belgelenmiş sırada ([skor, kutu, adet, sınıf]) doğru çözer', () => {
    const t = tensors();
    const out = decodeEfficientDet([t.scores, t.boxes, t.count, t.classes], options);
    expect(out.map((d) => d.label)).toEqual(['person', 'cup']);
    expect(out[0]!.score).toBeCloseTo(0.9);
    expect(out[0]!.box.x).toBeCloseTo(0.2);
    expect(out[0]!.box.y).toBeCloseTo(0.1);
    expect(out[0]!.box.width).toBeCloseTo(0.4);
    expect(out[0]!.box.height).toBeCloseTo(0.4);
  });

  it('SSD tarzı sırada ([kutu, sınıf, skor, adet]) da doğru çözer', () => {
    const t = tensors();
    const out = decodeEfficientDet([t.boxes, t.classes, t.scores, t.count], options);
    expect(out.map((d) => d.label)).toEqual(['person', 'cup']);
  });

  it('çıktı sırası ters/karışık olsa da sınıf ile skoru ayırt eder', () => {
    const t = tensors();
    const out = decodeEfficientDet([t.count, t.classes, t.boxes, t.scores], options);
    expect(out.map((d) => d.label)).toEqual(['person', 'cup']);
    expect(out[1]!.score).toBeCloseTo(0.7);
  });

  it('eşik altındakileri eler, maxResults sınırını uygular', () => {
    const t = tensors();
    expect(
      decodeEfficientDet([t.scores, t.boxes, t.count, t.classes], { scoreThreshold: 0.8, maxResults: 20 }),
    ).toHaveLength(1);
    expect(
      decodeEfficientDet([t.scores, t.boxes, t.count, t.classes], { scoreThreshold: 0.5, maxResults: 1 }),
    ).toHaveLength(1);
  });

  it('"???" etiketli ve aralık dışı sınıfları atlar', () => {
    const boxes = f32([0, 0, 1, 1, 0, 0, 1, 1], N * 4);
    const out = decodeEfficientDet(
      [f32([0.9, 0.9], N), boxes, f32([2], 1), f32([11, 500], N)], // 11 = '???', 500 = geçersiz
      options,
    );
    expect(out).toHaveLength(0);
  });

  it('beklenmeyen çıktı sayısında çökmeden boş döner', () => {
    expect(decodeEfficientDet([f32([1], 1)], options)).toEqual([]);
  });
});
