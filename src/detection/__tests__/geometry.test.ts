import {
  frameRectToViewRect,
  modelRectToFrameRect,
  uprightSize,
} from '../geometry';

describe('uprightSize', () => {
  it('90° döndürülmüş karelerde en-boyu değiştirir', () => {
    expect(uprightSize(1920, 1080, 'right')).toEqual({ width: 1080, height: 1920 });
    expect(uprightSize(1920, 1080, 'left')).toEqual({ width: 1080, height: 1920 });
  });
  it('up/down için boyutu korur', () => {
    expect(uprightSize(1080, 1920, 'up')).toEqual({ width: 1080, height: 1920 });
    expect(uprightSize(1080, 1920, 'down')).toEqual({ width: 1080, height: 1920 });
  });
});

describe('modelRectToFrameRect (contain / siyah bant)', () => {
  const input = { width: 300, height: 300 };

  it('kare karede dönüşüm birebirdir', () => {
    const r = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
    const out = modelRectToFrameRect(r, { width: 500, height: 500 }, input);
    expect(out.x).toBeCloseTo(0.1);
    expect(out.y).toBeCloseTo(0.2);
    expect(out.width).toBeCloseTo(0.3);
    expect(out.height).toBeCloseTo(0.4);
  });

  it('dik (9:16) karede üst/alt bantları geri alır', () => {
    // 1080x1920 -> 300x300: ölçek 300/1920, içerik genişliği 168.75px, yanlarda 65.625px bant
    const frame = { width: 1080, height: 1920 };
    // Modelin tüm içeriği: x 65.625/300 .. 234.375/300, y 0..1
    const content = { x: 65.625 / 300, y: 0, width: 168.75 / 300, height: 1 };
    const out = modelRectToFrameRect(content, frame, input);
    expect(out.x).toBeCloseTo(0);
    expect(out.y).toBeCloseTo(0);
    expect(out.width).toBeCloseTo(1);
    expect(out.height).toBeCloseTo(1);
  });

  it('yatay karede üst/alt bantları geri alır', () => {
    const frame = { width: 1920, height: 1080 };
    // içerik yüksekliği 168.75px => y: 65.625/300 .. 234.375/300
    const content = { x: 0, y: 65.625 / 300, width: 1, height: 168.75 / 300 };
    const out = modelRectToFrameRect(content, frame, input);
    expect(out.x).toBeCloseTo(0);
    expect(out.y).toBeCloseTo(0);
    expect(out.width).toBeCloseTo(1);
    expect(out.height).toBeCloseTo(1);
  });
});

describe('frameRectToViewRect (cover)', () => {
  it('oranlar aynıysa doğrudan ölçekler', () => {
    const out = frameRectToViewRect(
      { x: 0.5, y: 0.5, width: 0.25, height: 0.25 },
      { width: 1080, height: 1920 },
      { width: 360, height: 640 },
    );
    expect(out.x).toBeCloseTo(180);
    expect(out.y).toBeCloseTo(320);
    expect(out.width).toBeCloseTo(90);
    expect(out.height).toBeCloseTo(160);
  });

  it('ekran daha uzunsa kareyi yanlardan kırpar', () => {
    // kare 3:4, ekran 1:2 -> yükseklik doldurur, genişlik taşar, kenarlar kırpılır
    const frame = { width: 300, height: 400 };
    const view = { width: 200, height: 400 };
    const full = frameRectToViewRect({ x: 0, y: 0, width: 1, height: 1 }, frame, view);
    expect(full.height).toBeCloseTo(400);
    expect(full.width).toBeCloseTo(300);
    expect(full.x).toBeCloseTo(-50); // 50px her yandan taşar
    // karenin merkezi ekranın merkezinde kalmalı
    const center = frameRectToViewRect({ x: 0.5, y: 0.5, width: 0, height: 0 }, frame, view);
    expect(center.x).toBeCloseTo(100);
    expect(center.y).toBeCloseTo(200);
  });
});
