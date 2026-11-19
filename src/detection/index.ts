/**
 * Uygulamanın nesne tespiti için TEK giriş noktası.
 *
 * Motoru ya da modeli değiştirmek için yalnızca aşağıdaki `useObjectDetector` gövdesi değişir:
 *  - Başka bir TFLite modeli: `models/` altına yeni bir `TfliteDetectorModel` adaptörü yaz, burada seç.
 *  - Başka bir motor (ör. ML Kit, bulut API): `UseObjectDetector` sözleşmesini uygulayan bir hook yaz.
 */
import { useTfliteDetector } from './engines/tflite/useTfliteDetector';
import { efficientDetLite0 } from './models/efficientDetLite0';
import type { UseObjectDetector } from './types';

// Eski model (daha az doğru): import { cocoSsdMobilenetV1 } from './models/cocoSsdMobilenetV1';
export const useObjectDetector: UseObjectDetector = (options) =>
  useTfliteDetector(efficientDetLite0, options);

export * from './types';
export * from './geometry';
export * from './nms';
export * from './tracker';
export * from './useSmoothedResult';
