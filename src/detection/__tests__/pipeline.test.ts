import { frameRectToViewRect, modelRectToFrameRect } from '../geometry';

/**
 * Gerçek cihaz ölçümü (iPhone, 2026-11-20): kare 1080x1920 (orientation 'up'), model girdisi 300x300 "contain",
 * ekran 739x1600 (cover). Model, şişe için model uzayında x=0.51 y=0.30 w=0.13 h=0.38 verdi; şişe ekranda
 * yaklaşık x 390..560, y 510..1050 aralığındaydı.
 */
describe('model kutusu -> ekran (gerçek cihaz senaryosu)', () => {
  const frame = { width: 1080, height: 1920 };
  const input = { width: 300, height: 300 };
  const view = { width: 739, height: 1600 };

  it('şişenin kutusu gerçek şişenin üzerine oturur', () => {
    const inFrame = modelRectToFrameRect({ x: 0.51, y: 0.3, width: 0.13, height: 0.38 }, frame, input);
    const onScreen = frameRectToViewRect(inFrame, frame, view);

    // Beklenen (elle hesaplandı): x ~385..593, y ~480..1088
    expect(onScreen.x).toBeGreaterThan(370);
    expect(onScreen.x).toBeLessThan(410);
    expect(onScreen.x + onScreen.width).toBeGreaterThan(560);
    expect(onScreen.x + onScreen.width).toBeLessThan(620);
    expect(onScreen.y).toBeGreaterThan(450);
    expect(onScreen.y).toBeLessThan(520);
    expect(onScreen.y + onScreen.height).toBeGreaterThan(1040);
    expect(onScreen.y + onScreen.height).toBeLessThan(1110);
  });

  it('modelin tüm içerik alanı ekranın tamamını kaplar (cover, kenarlar taşar)', () => {
    // contain içeriği: x 0.21875..0.78125, y 0..1  ->  karenin tamamı
    const inFrame = modelRectToFrameRect({ x: 0.21875, y: 0, width: 0.5625, height: 1 }, frame, input);
    const onScreen = frameRectToViewRect(inFrame, frame, view);
    expect(onScreen.y).toBeCloseTo(0);
    expect(onScreen.height).toBeCloseTo(1600);
    expect(onScreen.width).toBeCloseTo(1600 * (1080 / 1920)); // 900, ekran 739 olduğu için iki yandan taşar
  });
});
