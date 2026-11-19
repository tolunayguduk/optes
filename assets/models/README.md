# Model dosyaları

| Dosya | Model | Lisans | Kaynak |
|---|---|---|---|
| `efficientdet_lite0.tflite` | EfficientDet-Lite0 (COCO, 320x320, uint8, yerleşik NMS) | Apache 2.0 | TensorFlow Hub / Kaggle `tensorflow/efficientdet`, `lite0-detection-metadata/1` |
| `coco_ssd_mobilenet_v1_quant.tflite` | SSD MobileNet v1 (COCO, 300x300, uint8, yerleşik NMS) | Apache 2.0 | TensorFlow Lite örnek modelleri (`coco_ssd_mobilenet_v1_1.0_quant_2018_06_29`) |

Hangi modelin kullanıldığı `src/detection/index.ts` içinde seçilir (bkz. `docs/adr/0002-tespit-soyutlamasi.md`).
| `blaze_face_short_range.tflite` | BlazeFace short-range (yüz bulucu, 128x128, ham anchor çıktısı) | Apache 2.0 | MediaPipe `face_detector/blaze_face_short_range/float16/latest` |
| `mobilefacenet.tflite` | MobileFaceNet (yüz parmak izi, 112x112 NCHW float, 128 boyut) | **Doğrulanmadı** (HF sayfası apache-2.0 diyor; eğitim verisi/orijinal lisans belirsiz) | Qualcomm AI Hub `mobile_facenet` v0.67.0. **Repoda DEĞİL**; `npm run models:face` ile indirilir |

Yüz modelleri için bkz. `docs/adr/0003-yuz-tanima.md`.
