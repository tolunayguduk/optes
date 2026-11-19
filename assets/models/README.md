# Model dosyaları

| Dosya | Model | Lisans | Kaynak |
|---|---|---|---|
| `efficientdet_lite0.tflite` | EfficientDet-Lite0 (COCO, 320x320, uint8, yerleşik NMS) | Apache 2.0 | TensorFlow Hub / Kaggle `tensorflow/efficientdet`, `lite0-detection-metadata/1` |
| `coco_ssd_mobilenet_v1_quant.tflite` | SSD MobileNet v1 (COCO, 300x300, uint8, yerleşik NMS) | Apache 2.0 | TensorFlow Lite örnek modelleri (`coco_ssd_mobilenet_v1_1.0_quant_2018_06_29`) |

Hangi modelin kullanıldığı `src/detection/index.ts` içinde seçilir (bkz. `docs/adr/0002-tespit-soyutlamasi.md`).
