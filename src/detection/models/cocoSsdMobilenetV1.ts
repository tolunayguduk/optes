import type { TfliteDetectorModel } from '../engines/tflite/types';
import { decodeCocoSsd } from './cocoSsdDecode';

/**
 * TensorFlow Lite "coco_ssd_mobilenet_v1_1.0_quant" (Apache 2.0).
 *  - Girdi : [1, 300, 300, 3] uint8 RGB
 *  - Çıktı : 0 = kutular [1,10,4] (ymin,xmin,ymax,xmax; 0..1), 1 = sınıf [1,10],
 *            2 = skor [1,10], 3 = adet [1]  (NMS modelin içinde yapılır)
 *  - Sınıf indeksi 0 tabanlıdır; etiket listesinde bir kaydırılır (bkz. cocoSsdDecode.ts).
 */
const INPUT = 300;

export const cocoSsdMobilenetV1: TfliteDetectorModel = {
  id: 'coco_ssd_mobilenet_v1_quant',
  source: require('../../../assets/models/coco_ssd_mobilenet_v1_quant.tflite'),
  delegates: [],
  inputSize: { width: INPUT, height: INPUT },
  decode: decodeCocoSsd,
};
