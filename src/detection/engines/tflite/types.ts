import type { ModelSource, TensorflowModelDelegate } from 'react-native-fast-tflite';

import type { Size } from '../../geometry';
import type { NormalizedRect } from '../../types';

/** Modelin çıktısından çözülen ham tespit; kutu, MODEL GİRDİSİNE göre normalize edilmiştir. */
export interface RawDetection {
  label: string;
  score: number;
  box: NormalizedRect;
}

export interface DecodeOptions {
  scoreThreshold: number;
  maxResults: number;
}

/**
 * Bir TFLite nesne tespit modelinin "adaptörü".
 * Yeni bir model eklemek = bu arayüzü uygulayan tek bir dosya yazmak.
 * (Dosya `models/` altına, sonra `engines/tflite/index.ts` içindeki seçime bağlanır.)
 */
export interface TfliteDetectorModel {
  /** Kayıt/log için benzersiz ad. */
  id: string;
  /** `require('...tflite')` veya `{ url }`. */
  source: ModelSource;
  delegates: TensorflowModelDelegate[];
  /** Modelin beklediği girdi boyutu (piksel). Girdi her zaman RGB, kare başına 3 bayt (uint8), HWC. */
  inputSize: Size;
  /**
   * Model çıktı tensörlerini tespit listesine çevirir. Worklet thread'inde çalışır,
   * bu yüzden `'worklet'` yönergesini içermeli ve yalnızca saf veriyle çalışmalıdır.
   */
  decode: (outputs: ArrayBuffer[], options: DecodeOptions) => RawDetection[];
}
