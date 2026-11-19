/**
 * Uygulamanın nesne tespiti için TEK giriş noktası.
 *
 * Motoru ya da modeli değiştirmek için yalnızca aşağıdaki `useObjectDetector` gövdesi değişir:
 *  - Başka bir TFLite modeli: `models/` altına yeni bir `TfliteDetectorModel` adaptörü yaz, burada seç.
 *  - Başka bir motor (ör. ML Kit, bulut API): `UseObjectDetector` sözleşmesini uygulayan bir hook yaz.
 */
import { cocoSsdMobilenetV1 } from './models/cocoSsdMobilenetV1';
import { useTfliteDetector } from './engines/tflite/useTfliteDetector';
import type { UseObjectDetector } from './types';

export const useObjectDetector: UseObjectDetector = (options) =>
  useTfliteDetector(cocoSsdMobilenetV1, options);

export * from './types';
export * from './geometry';
