# ADR-0002: Nesne tespiti soyutlaması (adaptör katmanı)

- **Durum:** Kabul edildi
- **Tarih:** 2026-11-19

## Bağlam

Kullanılan model (şimdilik COCO SSD MobileNet v1) ve motor (TFLite) ileride değişebilir: daha doğru bir model, ML Kit ya da bulut tabanlı bir API. Değişiklik ekranlara, overlay'e ve testlere yayılmamalı.

## Karar

İki katmanlı soyutlama:

1. **Motor sözleşmesi** (`src/detection/types.ts`): `UseObjectDetector` hook'u, `ObjectDetector { status, error, outputs, result }`, `Detection`, `DetectionFrame`. Ekranlar yalnızca bunlara bağımlıdır. Tek seçim noktası `src/detection/index.ts`.
2. **TFLite model adaptörü** (`src/detection/engines/tflite/types.ts`): `TfliteDetectorModel { id, source, delegates, inputSize, decode }`. Yeni TFLite modeli = `models/` altına tek dosya (adaptör + `decode`) ve `index.ts`'te seçim.

Koordinat dönüşümleri (`geometry.ts`) ve çıktı çözücüler (`cocoSsdDecode.ts`) saf fonksiyonlardır ve birim testlidir; kamera ya da model olmadan test edilir.

## Nasıl değiştirilir

- **Başka TFLite modeli:** `TfliteDetectorModel` uygula (girdi boyutu, çıktı çözücü) ve `src/detection/index.ts` içinde seç. Girdi biçimi şu an uint8 RGB HWC ile sabit; farklı biçim (float32, NCHW) gerekirse `useTfliteDetector` içindeki resizer ayarı adaptörden okunacak şekilde genişletilir.
- **Başka motor:** `UseObjectDetector` sözleşmesini uygulayan yeni bir hook yaz.

## Seçilen ilk model

`coco_ssd_mobilenet_v1_1.0_quant` (Apache 2.0, 4,2 MB): 300x300 uint8 girdi, NMS modelin içinde, 10 tespit, COCO 80 sınıf. Eski (2018) ve orta doğrulukta; MVP için seçildi. MediaPipe'ın EfficientDet/SSD modelleri ham anchor çıktısı verdiği için (anchor çözümü + NMS gerekir) şimdilik elendi.

## Sonuçlar

- (+) Model/motor değişimi tek noktada; çekirdek mantık testli.
- (−) Soyutlama TFLite girdi biçimini şimdilik sabitler (uint8 RGB HWC).
- (−) Sözleşme Vision Camera'nın `CameraOutput` tipine bağlıdır (kamera zaten uygulama kararı).
