import type { CameraOutput } from 'react-native-vision-camera';

import type { NormalizedRect } from '../detection/types';

/** Bir karede bulunan tek bir yüz: kutu (dik karenin normalize koordinatı) ve yüz parmak izi. */
export interface FaceObservation {
  box: NormalizedRect;
  /** Yüz bulucunun güveni (0..1). */
  detScore: number;
  /** 128 boyutlu, birim uzunlukta yüz parmak izi (embedding). */
  embedding: number[];
}

export interface FaceFrame {
  faces: FaceObservation[];
  frameWidth: number;
  frameHeight: number;
  /** Her yayında artan sıra numarası (aynı kareyi iki kez saymamak için). */
  seq: number;
}

export interface FaceRecognizerOptions {
  /** Tanı metnini açar (hata ayıklama). */
  diagnostics?: boolean;
  /** İki işlem arasındaki en kısa süre (ms). Varsayılan 200 (~5 kare/sn). */
  minIntervalMs?: number;
  /** Karede en fazla kaç yüz işlenir. Varsayılan 3. */
  maxFaces?: number;
  /** Yüz bulucu eşiği (0..1). Varsayılan 0.6. */
  scoreThreshold?: number;
}

export interface FaceRecognizer {
  status: 'loading' | 'ready' | 'error';
  error?: Error;
  outputs: CameraOutput[];
  /** En son işlenen kare; henüz yoksa null. */
  frame: FaceFrame | null;
  diagnostics?: string;
}
