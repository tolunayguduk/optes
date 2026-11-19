import type { CameraOutput } from 'react-native-vision-camera';

/**
 * Motor-bağımsız nesne tespiti sözleşmesi.
 *
 * Uygulamanın geri kalanı (ekranlar, overlay) yalnızca bu dosyadaki tiplere bağımlıdır.
 * Altta TFLite, ML Kit ya da bulut tabanlı bir model olması fark etmez; değiştirmek için
 * `src/detection/index.ts` içindeki tek satırı değiştirmek yeterlidir.
 */

/** 0..1 aralığında normalize dikdörtgen. Orijin sol üst köşe. */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tek bir tespit. `box`, kameranın dik (döndürülmüş, aynalanmamış) karesine göre normalize edilir. */
export interface Detection {
  label: string;
  /** 0..1 güven skoru */
  score: number;
  box: NormalizedRect;
}

/** Basit 2B nokta/vektör. */
export interface PointXY {
  x: number;
  y: number;
}

/**
 * Kare (frame) koordinatlarından kamera koordinatlarına afin dönüşüm: kare normalize (u, v) için
 * kamera noktası = origin + u * axisX + v * axisY. Kameranın kendi dönüşümünden üç noktayla elde edilir;
 * böylece döndürme, aynalama ve görüş alanı kırpması motor tarafından değil kamera tarafından çözülür.
 */
export interface FrameToCamera {
  origin: PointXY;
  axisX: PointXY;
  axisY: PointXY;
}

/** Bir kareden çıkan tespitler ve o karenin dik boyutu (piksel). */
export interface DetectionFrame {
  detections: Detection[];
  /** Dik (rotasyon uygulanmış) kare boyutu; kutuları ekrana oturtmak için gerekir. */
  frameWidth: number;
  frameHeight: number;
  /** Varsa, kare -> kamera dönüşümü; overlay önizleme koordinatlarını buradan kamera üzerinden bulur. */
  frameToCamera?: FrameToCamera;
}

export type DetectorStatus = 'loading' | 'ready' | 'error';

export interface ObjectDetectorOptions {
  /** Bu değerin altındaki tespitler elenir. Varsayılan 0.5 (FR-6). */
  scoreThreshold?: number;
  /** Kare başına en fazla bu kadar tespit döner. */
  maxResults?: number;
  /** true ise motor, işlem hattı sayaçlarını `ObjectDetector.diagnostics` içinde metin olarak sunar (hata ayıklama). */
  diagnostics?: boolean;
}

export interface ObjectDetector {
  status: DetectorStatus;
  error?: Error;
  /** `<Camera outputs={[...]} />` içine verilecek çıktılar. `status !== 'ready'` iken boş olabilir. */
  outputs: CameraOutput[];
  /** En son tamamlanan tespit; henüz yoksa `null`. */
  result: DetectionFrame | null;
  /** `options.diagnostics` açıkken, motorun iç durumunu anlatan çok satırlı metin. */
  diagnostics?: string;
  /** `options.diagnostics` açıkken, modelin gördüğü görüntünün küçük bir data URI'si (BMP). */
  diagnosticsImage?: string;
}

/** Bir tespit motorunu React'e bağlayan hook sözleşmesi. */
export type UseObjectDetector = (options?: ObjectDetectorOptions) => ObjectDetector;
