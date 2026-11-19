import { frameRectToViewRectViaCamera } from '../geometry';

const toView = (p: { x: number; y: number }) => ({ x: p.x * 360, y: p.y * 640 });

describe('frameRectToViewRectViaCamera', () => {
  const identity = { origin: { x: 0, y: 0 }, axisX: { x: 1, y: 0 }, axisY: { x: 0, y: 1 } };

  it('kare=kamera iken yalnızca ölçekler', () => {
    const out = frameRectToViewRectViaCamera(
      { x: 0.5, y: 0.25, width: 0.25, height: 0.5 },
      identity,
      toView,
    );
    expect(out.x).toBeCloseTo(180);
    expect(out.y).toBeCloseTo(160);
    expect(out.width).toBeCloseTo(90);
    expect(out.height).toBeCloseTo(320);
  });

  it('x ekseni ters (aynalı) dönüşümde sınırlayıcı kutuyu doğru verir', () => {
    const mirrored = { origin: { x: 1, y: 0 }, axisX: { x: -1, y: 0 }, axisY: { x: 0, y: 1 } };
    const out = frameRectToViewRectViaCamera(
      { x: 0, y: 0, width: 0.25, height: 0.5 },
      mirrored,
      toView,
    );
    expect(out.x).toBeCloseTo(270); // 0.75..1.0 -> 270..360
    expect(out.width).toBeCloseTo(90);
    expect(out.height).toBeCloseTo(320);
  });

  it('eksenleri yer değiştiren (90° döndürülmüş) dönüşümde genişlik/yükseklik yer değiştirir', () => {
    const swapped = { origin: { x: 0, y: 0 }, axisX: { x: 0, y: 1 }, axisY: { x: 1, y: 0 } };
    const out = frameRectToViewRectViaCamera(
      { x: 0, y: 0, width: 0.5, height: 0.25 },
      swapped,
      toView,
    );
    expect(out.width).toBeCloseTo(0.25 * 360);
    expect(out.height).toBeCloseTo(0.5 * 640);
  });

  it('görüş alanı kırpmasını (origin + ölçek) uygular', () => {
    // kamera, karenin yalnızca ortadaki %50'sini (0.25..0.75) kapsıyor
    const cropped = { origin: { x: 0.25, y: 0 }, axisX: { x: 0.5, y: 0 }, axisY: { x: 0, y: 1 } };
    const out = frameRectToViewRectViaCamera(
      { x: 0, y: 0, width: 1, height: 1 },
      cropped,
      toView,
    );
    expect(out.x).toBeCloseTo(0.25 * 360);
    expect(out.width).toBeCloseTo(0.5 * 360);
  });
});
