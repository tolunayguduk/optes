import {
  FACE_SIZE,
  TEMPLATE_LEFT_EYE,
  TEMPLATE_RIGHT_EYE,
  eyeAlignment,
  warpFaceToTensor,
} from '../align';
import { BLAZEFACE_ANCHOR_COUNT, generateBlazeFaceAnchors } from '../anchors';
import { decodeBlazeFace } from '../blazeFace';
import { averageEmbeddings, cosineSimilarity, l2Normalize } from '../embedding';
import { matchFace, type Person } from '../gallery';

describe('generateBlazeFaceAnchors', () => {
  const anchors = generateBlazeFaceAnchors();

  it('MediaPipe modeliyle aynı sayıda (896) anchor üretir', () => {
    expect(anchors.length / 2).toBe(BLAZEFACE_ANCHOR_COUNT);
  });

  it('tüm merkezler 0..1 aralığında ve ilk anchor ilk hücrenin merkezindedir', () => {
    for (const v of anchors) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
    expect(anchors[0]).toBeCloseTo(0.5 / 16);
    expect(anchors[1]).toBeCloseTo(0.5 / 16);
    // aynı hücrede 2 anchor aynı merkezi paylaşır
    expect(anchors[2]).toBeCloseTo(anchors[0]!);
  });

  it('ilk 512 anchor 16x16, sonraki 384 anchor 8x8 haritadandır', () => {
    // 512. anchor (indeks 512) 8x8 haritanın ilk hücresi: merkez 0.5/8
    expect(anchors[512 * 2]).toBeCloseTo(0.5 / 8);
    // son anchor son hücrenin merkezi: 7.5/8
    expect(anchors[(BLAZEFACE_ANCHOR_COUNT - 1) * 2]).toBeCloseTo(7.5 / 8);
  });
});

describe('decodeBlazeFace', () => {
  const anchors = generateBlazeFaceAnchors();
  const N = BLAZEFACE_ANCHOR_COUNT;

  function empty() {
    return { reg: new Float32Array(N * 16), scores: new Float32Array(N).fill(-20) };
  }

  it('güçlü bir anchor için kutuyu ve anahtar noktaları doğru çözer', () => {
    const { reg, scores } = empty();
    const i = 100;
    scores[i] = 5; // sigmoid ~0.993
    // merkez kayması +12.8 px (=0.1), genişlik 25.6 px (=0.2), yükseklik 38.4 px (=0.3)
    reg[i * 16] = 12.8;
    reg[i * 16 + 1] = 0;
    reg[i * 16 + 2] = 25.6;
    reg[i * 16 + 3] = 38.4;
    reg[i * 16 + 4] = 6.4; // ilk anahtar nokta x kayması 0.05
    const faces = decodeBlazeFace(reg, scores, anchors, 0.5, 0.3, 5);
    expect(faces).toHaveLength(1);
    const f = faces[0]!;
    const ax = anchors[i * 2]!;
    const ay = anchors[i * 2 + 1]!;
    expect(f.width).toBeCloseTo(0.2);
    expect(f.height).toBeCloseTo(0.3);
    expect(f.x + f.width / 2).toBeCloseTo(ax + 0.1);
    expect(f.y + f.height / 2).toBeCloseTo(ay);
    expect(f.keypoints[0]).toBeCloseTo(ax + 0.05);
    expect(f.score).toBeGreaterThan(0.99);
  });

  it('eşik altı skorları eler', () => {
    const { reg, scores } = empty();
    scores[10] = -1; // sigmoid ~0.27
    expect(decodeBlazeFace(reg, scores, anchors, 0.5, 0.3, 5)).toHaveLength(0);
  });

  it('aynı yüzün örtüşen kutularından yalnızca en yüksek skorluyu tutar', () => {
    const { reg, scores } = empty();
    for (const i of [200, 201]) {
      // 200 ve 201 aynı hücrenin iki anchor'ı (aynı merkez)
      scores[i] = i === 200 ? 4 : 3;
      reg[i * 16 + 2] = 25.6;
      reg[i * 16 + 3] = 25.6;
    }
    const faces = decodeBlazeFace(reg, scores, anchors, 0.5, 0.3, 5);
    expect(faces).toHaveLength(1);
    expect(faces[0]!.score).toBeGreaterThan(0.98);
  });

  it('maxFaces sınırını uygular', () => {
    const { reg, scores } = empty();
    // birbirinden uzak üç anchor
    for (const i of [0, 300, 800]) {
      scores[i] = 5;
      reg[i * 16 + 2] = 12.8;
      reg[i * 16 + 3] = 12.8;
    }
    expect(decodeBlazeFace(reg, scores, anchors, 0.5, 0.3, 2)).toHaveLength(2);
  });
});

describe('eyeAlignment', () => {
  it('şablon gözleri kaynak gözlere taşır (herhangi ölçek/döndürme/öteleme için)', () => {
    const eyeL = { x: 300, y: 400 };
    const eyeR = { x: 380, y: 430 }; // eğik
    const t = eyeAlignment(eyeL, eyeR);
    const map = (u: number, v: number) => ({ x: t.a * u + t.b * v + t.c, y: t.d * u + t.e * v + t.f });
    const l = map(TEMPLATE_LEFT_EYE.x, TEMPLATE_LEFT_EYE.y);
    const r = map(TEMPLATE_RIGHT_EYE.x, TEMPLATE_RIGHT_EYE.y);
    expect(l.x).toBeCloseTo(300);
    expect(l.y).toBeCloseTo(400);
    expect(r.x).toBeCloseTo(380);
    expect(r.y).toBeCloseTo(430);
  });

  it('göz sırası verilişinden bağımsızdır', () => {
    const a = eyeAlignment({ x: 100, y: 100 }, { x: 160, y: 100 });
    const b = eyeAlignment({ x: 160, y: 100 }, { x: 100, y: 100 });
    expect(a.a).toBeCloseTo(b.a);
    expect(a.c).toBeCloseTo(b.c);
  });
});

describe('warpFaceToTensor', () => {
  // 224x224 gri tonlu degrade: R = x (0..223), G = y, B = 0
  const W = 224;
  const rgb = new Uint8Array(W * W * 3);
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      rgb[(y * W + x) * 3] = x;
      rgb[(y * W + x) * 3 + 1] = y;
    }
  }
  const plane = FACE_SIZE * FACE_SIZE;

  it('2x ölçekli düz hizalamada çıktı pikseli kaynağın 2 katı koordinatından gelir', () => {
    const identity2x = { a: 2, b: 0, c: 0, d: 0, e: 2, f: 0 };
    const out = warpFaceToTensor(rgb, W, W, identity2x, false);
    expect(out.length).toBe(3 * plane);
    // çıktı (u=10, v=20) -> kaynak (20, 40): R = 20/255, G = 40/255
    expect(out[0 * plane + 20 * FACE_SIZE + 10]).toBeCloseTo(20 / 255, 4);
    expect(out[1 * plane + 20 * FACE_SIZE + 10]).toBeCloseTo(40 / 255, 4);
  });

  it('aynalamada çıktı yatay olarak tersine çevrilir', () => {
    const identity2x = { a: 2, b: 0, c: 0, d: 0, e: 2, f: 0 };
    const normal = warpFaceToTensor(rgb, W, W, identity2x, false);
    const flipped = warpFaceToTensor(rgb, W, W, identity2x, true);
    const v = 30;
    expect(flipped[v * FACE_SIZE + 0]).toBeCloseTo(normal[v * FACE_SIZE + (FACE_SIZE - 1)]!, 5);
    expect(flipped[v * FACE_SIZE + 5]).toBeCloseTo(normal[v * FACE_SIZE + (FACE_SIZE - 1 - 5)]!, 5);
  });

  it('kaynak görüntü dışındaki bölgeyi siyah bırakır', () => {
    const farAway = { a: 1, b: 0, c: 10000, d: 0, e: 1, f: 10000 };
    const out = warpFaceToTensor(rgb, W, W, farAway, false);
    expect(Math.max(...out)).toBe(0);
  });

  it('değerleri 0..1 aralığında üretir', () => {
    const out = warpFaceToTensor(rgb, W, W, { a: 1, b: 0, c: 50, d: 0, e: 1, f: 50 }, false);
    for (const v of out) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('embedding ve eşleştirme', () => {
  it('l2Normalize birim uzunluk üretir', () => {
    const n = l2Normalize([3, 4]);
    expect(n[0]).toBeCloseTo(0.6);
    expect(n[1]).toBeCloseTo(0.8);
  });

  it('kosinüs benzerliği: aynı=1, dik=0, zıt=-1, uzunluk uyumsuzluğu=0', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });

  it('averageEmbeddings birim uzunlukta ortalama verir', () => {
    const avg = averageEmbeddings([
      [1, 0],
      [0, 1],
    ]);
    expect(Math.hypot(avg[0]!, avg[1]!)).toBeCloseTo(1);
    expect(avg[0]).toBeCloseTo(avg[1]!);
  });

  const people: Person[] = [
    { name: 'Ayşe', embeddings: [[1, 0, 0]] },
    { name: 'Mehmet', embeddings: [[0, 1, 0], [0, 0.9, 0.1]] },
  ];

  it('en benzer kişiyi eşik üstündeyse döndürür', () => {
    const m = matchFace([0.1, 0.99, 0], people, 0.5);
    expect(m.name).toBe('Mehmet');
    expect(m.similarity).toBeGreaterThan(0.9);
  });

  it('eşik altındaysa bilinmeyen döner ama en yakın aday bilinir', () => {
    const m = matchFace([0.5, 0.5, 0.7], people, 0.95);
    expect(m.name).toBeNull();
    expect(m.candidate).not.toBeNull();
  });

  it('kayıtlı kimse yoksa bilinmeyen ve benzerlik 0', () => {
    expect(matchFace([1, 0, 0], [], 0.5)).toEqual({ name: null, similarity: 0, candidate: null });
  });
});
