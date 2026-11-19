import type { TfliteDetectorModel } from '../engines/tflite/types';
import { decodeEfficientDet } from './efficientDetDecode';

/**
 * TensorFlow Hub / Kaggle "efficientdet/lite0-detection-metadata" (Apache 2.0, COCO 90 sınıf).
 *  - Girdi : [1, 320, 320, 3] uint8 RGB
 *  - Çıktı : yerleşik NMS (25 tespite kadar); bkz. efficientDetDecode.ts
 * SSD MobileNet v1'e göre daha doğru ve uzun/dar nesnelerde daha tutarlı olması beklenir.
 */
export const efficientDetLite0: TfliteDetectorModel = {
  id: 'efficientdet_lite0',
  source: require('../../../assets/models/efficientdet_lite0.tflite'),
  delegates: [],
  inputSize: { width: 320, height: 320 },
  decode: decodeEfficientDet,
};
