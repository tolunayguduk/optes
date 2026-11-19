# ADR-0001: Teknoloji seçimi

- **Durum:** Önerildi
- **Tarih:** 2026-11-19

## Bağlam

Android ve iOS için tek kod tabanlı, canlı kamera üzerinde gerçek zamanlı nesne tespiti yapan bir mobil uygulama. Tasarım dili Ant Design. Backend yok. Geliştirici Windows kullanıyor ve mobil deneyimi kısıtlı.

## Seçenekler

1. **React Native + Expo (seçilen):** Ant Design Mobile RN mevcut, geniş topluluk, TypeScript, EAS Build ile Mac'siz iOS derlemesi.
2. **Flutter:** Güçlü çapraz platform, ancak Ant Design'ın resmi karşılığı yok (tema elle uyarlanır).
3. **Native (Kotlin + Swift):** En yüksek performans, ancak iki ayrı kod tabanı ve yüksek öğrenme maliyeti.

## Karar

- React Native + Expo (development build) + TypeScript
- `@ant-design/react-native` UI
- `react-native-vision-camera` v5 (Nitro tabanlı) kamera ve `useFrameOutput`; `react-native-vision-camera-worklets`, `react-native-worklets` ve `react-native-vision-camera-resizer` ile kare işleme (güncelleme: ilk taslak v4 + worklets-core varsayıyordu, kurulumda v5 olduğu görüldü)
- `react-native-fast-tflite` ile COCO eğitimli, 80 sınıflı TFLite nesne tespit modeli (hafif sürüm, ör. EfficientDet-Lite veya YOLO tabanlı; cihazda ölçülerek seçilecek)
- `@shopify/react-native-skia` ile kutu ve etiket çizimi
- Derleme: GitHub Actions macOS runner ile imzasız IPA; Sideloadly ile ücretsiz Apple ID imzası ve iPhone'a yükleme (güncelleme: Apple Developer hesabı yok, EAS iOS cihaz derlemesi ücretli hesap ister)
- Apple hesabı alınırsa EAS Build'e geçilir

## Sonuçlar

- (+) Tek kod tabanı, Ant Design uyumu, Mac olmadan iOS derlemesi
- (+) Backend gerekmez, gizlilik güçlü (veri cihazdan çıkmaz)
- (−) Expo Go kullanılamaz, development build gerekir
- (−) Ücretsiz imza ile uygulama 7 günde süresi dolar, yeniden yüklenmesi gerekir; en fazla 3 uygulama
- (−) iOS fiziksel cihaz gerekir; yükleme akışı (IPA imzalama) kurulumda doğrulanmalı
- (−) Kamera ile model koordinat dönüşümü dikkatle uygulanıp testlenmeli
- (−) Sadece COCO sınıfları tanınır

## Yeniden değerlendirme koşulları

Hedef cihazlarda 15 FPS sağlanamazsa veya sınıf kapsamı yetersiz kalırsa model/yaklaşım (ör. ML Kit, daha hafif model) gözden geçirilir.
