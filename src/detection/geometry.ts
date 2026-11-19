import type { FrameToCamera, NormalizedRect, PointXY } from './types';

export type FrameOrientation = 'up' | 'right' | 'down' | 'left';

export interface Size {
  width: number;
  height: number;
}

/**
 * Kamera karesi, sensörün yönünde gelir (ör. 1920x1080 ve orientation: 'right').
 * 90° döndürülmüş karelerde dik görüntünün boyutu en-boy yer değiştirmiş olur.
 */
export function uprightSize(width: number, height: number, orientation: FrameOrientation): Size {
  'worklet';
  return orientation === 'left' || orientation === 'right'
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Model girdisine "contain" (siyah bantlı, oran korunur) ile yerleştirilmiş bir karede,
 * model koordinatlarındaki (0..1) kutuyu dik karenin normalize koordinatlarına çevirir.
 */
export function modelRectToFrameRect(rect: NormalizedRect, frame: Size, input: Size): NormalizedRect {
  'worklet';
  const scale = Math.min(input.width / frame.width, input.height / frame.height);
  const contentW = (frame.width * scale) / input.width; // girdinin normalize kapladığı genişlik
  const contentH = (frame.height * scale) / input.height;
  const padX = (1 - contentW) / 2;
  const padY = (1 - contentH) / 2;
  return {
    x: (rect.x - padX) / contentW,
    y: (rect.y - padY) / contentH,
    width: rect.width / contentW,
    height: rect.height / contentH,
  };
}

/**
 * Dik karenin normalize kutusunu ekran (view) piksellerine çevirir.
 * Kamera önizlemesinin `cover` (kırparak doldur) modunda olduğu varsayılır.
 */
export function frameRectToViewRect(rect: NormalizedRect, frame: Size, view: Size): NormalizedRect {
  'worklet';
  const scale = Math.max(view.width / frame.width, view.height / frame.height);
  const shownW = frame.width * scale;
  const shownH = frame.height * scale;
  const offsetX = (view.width - shownW) / 2;
  const offsetY = (view.height - shownH) / 2;
  return {
    x: offsetX + rect.x * shownW,
    y: offsetY + rect.y * shownH,
    width: rect.width * shownW,
    height: rect.height * shownH,
  };
}

/** Değeri [0, 1] aralığına sıkıştırır. */
export function clamp01(v: number): number {
  'worklet';
  return Math.min(1, Math.max(0, v));
}

/**
 * Dik karenin normalize kutusunu, kameranın kendi dönüşümleri üzerinden ekran (view) piksellerine çevirir:
 * kare -> kamera (`frameToCamera`) -> önizleme (`toView`, örn. `CameraRef.convertCameraPointToViewPoint`).
 * Dört köşe dönüştürülüp sınırlayıcı dikdörtgen alınır; böylece döndürme/aynalama da doğru işlenir.
 */
export function frameRectToViewRectViaCamera(
  rect: NormalizedRect,
  frameToCamera: FrameToCamera,
  toView: (cameraPoint: PointXY) => PointXY,
): NormalizedRect {
  const { origin, axisX, axisY } = frameToCamera;
  const corners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ];
  const points = corners.map(([u, v]) =>
    toView({ x: origin.x + u * axisX.x + v * axisY.x, y: origin.y + u * axisX.y + v * axisY.y }),
  );
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
