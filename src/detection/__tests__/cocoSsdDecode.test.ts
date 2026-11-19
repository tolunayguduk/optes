import { decodeCocoSsd } from '../models/cocoSsdDecode';

function tensors(opts: {
  boxes: number[][];
  classes: number[];
  scores: number[];
  count?: number;
}): ArrayBuffer[] {
  const pad = (a: number[], n: number) => Float32Array.from([...a, ...new Array(n - a.length).fill(0)]);
  return [
    pad(opts.boxes.flat(), 40).buffer,
    pad(opts.classes, 10).buffer,
    pad(opts.scores, 10).buffer,
    Float32Array.from([opts.count ?? opts.scores.length]).buffer,
  ];
}

const options = { scoreThreshold: 0.5, maxResults: 10 };

describe('decodeCocoSsd', () => {
  it('kutu sırasını (ymin,xmin,ymax,xmax) x/y/genişlik/yükseklik olarak çevirir', () => {
    const out = decodeCocoSsd(
      tensors({ boxes: [[0.1, 0.2, 0.5, 0.8]], classes: [0], scores: [0.9] }),
      options,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.box.x).toBeCloseTo(0.2);
    expect(out[0]!.box.y).toBeCloseTo(0.1);
    expect(out[0]!.box.width).toBeCloseTo(0.6);
    expect(out[0]!.box.height).toBeCloseTo(0.4);
  });

  it('0 tabanlı sınıfı doğru etikete eşler (0 = person, 16 = cat)', () => {
    const out = decodeCocoSsd(
      tensors({
        boxes: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        classes: [0, 16],
        scores: [0.9, 0.8],
      }),
      options,
    );
    expect(out.map((d) => d.label)).toEqual(['person', 'cat']);
  });

  it('eşiğin altındaki skorları eler', () => {
    const out = decodeCocoSsd(
      tensors({
        boxes: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        classes: [0, 2],
        scores: [0.49, 0.5],
      }),
      options,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.label).toBe('car');
  });

  it('adet değerine uyar, fazlasını okumaz', () => {
    const out = decodeCocoSsd(
      tensors({
        boxes: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        classes: [0, 1],
        scores: [0.9, 0.9],
        count: 1,
      }),
      options,
    );
    expect(out).toHaveLength(1);
  });

  it('maxResults sınırını uygular', () => {
    const out = decodeCocoSsd(
      tensors({
        boxes: [
          [0, 0, 1, 1],
          [0, 0, 1, 1],
          [0, 0, 1, 1],
        ],
        classes: [0, 1, 2],
        scores: [0.9, 0.9, 0.9],
      }),
      { scoreThreshold: 0.5, maxResults: 2 },
    );
    expect(out).toHaveLength(2);
  });

  it('"???" etiketli (boş) sınıfları atlar', () => {
    // sınıf 11 -> labels[12] === '???'
    const out = decodeCocoSsd(
      tensors({ boxes: [[0, 0, 1, 1]], classes: [11], scores: [0.9] }),
      options,
    );
    expect(out).toHaveLength(0);
  });
});
