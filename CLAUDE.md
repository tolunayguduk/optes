# CLAUDE.md

Bu dosya Claude Code için proje bağlamını, kuralları ve konuşma notlarını içerir. Her önemli karar sonrası güncellenir.

## Proje Özeti

- **Proje adı:** optes (çalışma adı)
- **Ana amaç:** Görüntü işleme uygulaması
- **Durum:** Başlangıç / Planlama aşaması
- **Dizin:** `D:\claude\optes`
- **Platform:** Windows 11

## Ürün Tanımı

- **Tip:** Mobil uygulama, Android + iOS (tek kod tabanı).
- **Ana akış:** Uygulama ilk açıldığında tam ekran kamera açılır. Canlı görüntüdeki nesneler kutu (bounding box) içine alınır ve her kutunun üstünde küçük bir etiket (nesne adı, güven skoru) gösterilir.
- **Backend:** Şimdilik yok. Tüm işleme cihaz üzerinde (on-device) yapılır. İleride gerekirse eklenir.
- **Tasarım dili:** Ant Design.
- **Kullanıcı bağlamı:** Kullanıcının mobil geliştirme deneyimi kısıtlı. Mimari ve tasarım kararlarını Claude verir, gerekçeleriyle belgeler.

## Mimari Kararlar (özet, ayrıntı: `docs/adr/`)

| Konu | Karar |
|---|---|
| Framework | React Native + Expo (development build, prebuild), TypeScript |
| UI kiti | `@ant-design/react-native` (Ant Design Mobile RN) |
| Kamera | `react-native-vision-camera` v4 (frame processor) |
| Nesne tespiti | On-device TFLite, COCO (80 sınıf) modeli, `react-native-fast-tflite` ile |
| Kutu/etiket çizimi | `@shopify/react-native-skia` overlay (kamera üstünde) |
| Frame işleme | `react-native-worklets-core` ile ayrı thread'de |
| Durum yönetimi | Minimal (React state/Zustand), ilk sürümde gerekirse |
| Test | Jest + React Native Testing Library; iş mantığı (kutu koordinat dönüşümü, NMS) birim testli |
| Derleme/CI | GitHub Actions: lint + test + imzasız iOS IPA derlemesi (macOS runner). EAS Build iOS cihaz derlemesi ücretli Apple hesabı ister, şimdilik kullanılmıyor |
| iOS dağıtım (hesapsız) | IPA, Windows'ta Sideloadly ile ücretsiz Apple ID'yle imzalanıp iPhone'a yüklenir (7 gün geçerli, en fazla 3 uygulama) |
| Android | Cihaz yok, şimdilik hedef dışı test. Kod çapraz platform kalır |

**Gerekçe:** Ant Design'ın resmi mobil sürümü React Native için var; tek kod tabanı iki platformu kapsar. Kullanıcı Windows'ta çalıştığı için iOS derlemesi EAS Build (bulut) ile yapılacak. Vision Camera + TFLite, gerçek zamanlı nesne tespiti için yaygın ve olgun bir kombinasyon. Expo Go bu native modüllerle çalışmaz, development build gerekir.

**Bilinen riskler:**
- iOS testi için Apple Developer hesabı (ücretli) ve fiziksel cihaz gerekir.
- Kamera önizleme koordinatları ile model girişi koordinatları arasındaki dönüşüm (rotasyon, oran, ölçek) hataya açık, ayrı bir modülde testlenecek.
- COCO 80 sınıf dışındaki nesneler tanınmaz; sınıf kapsamı sonraki sürümde genişletilebilir.
- Model seçimi (hız/doğruluk dengesi) cihazda ölçülerek netleştirilecek.

## Açık Sorular

- [ ] Etiket dili Türkçe mi İngilizce mi olsun? (COCO etiketleri İngilizce, Türkçe için çeviri tablosu gerekir)
- [ ] Hedef minimum Android/iOS sürümü
- [ ] Uygulama adı ve paket kimliği (bundle id)
- [ ] Apple Developer hesabı var mı? Fiziksel iOS/Android test cihazı var mı?
- [ ] Ayrı ayarlar ekranı gerekli mi, yoksa sadece kamera ekranı mı? (Varsayılan: sadece kamera)

## SDLC Kuralları

Proje Yazılım Geliştirme Yaşam Döngüsü (SDLC) aşamalarına uygun yürütülür:

1. **Gereksinim Analizi** — Fonksiyonel/fonksiyonel olmayan gereksinimler `docs/requirements.md` içinde tutulur.
2. **Tasarım** — Mimari ve modül tasarımı `docs/design.md` içinde; önemli kararlar `docs/adr/` altında ADR olarak kaydedilir.
3. **Geliştirme** — Küçük, odaklı değişiklikler; okunabilir ve belgelenmiş kod.
4. **Test** — Birim ve entegrasyon testleri; yeni özellik testsiz birleştirilmez.
5. **Dağıtım** — Sürümleme (SemVer), değişiklik günlüğü (`CHANGELOG.md`).
6. **Bakım** — Hata takibi, bağımlılık güncellemeleri, dokümantasyon güncel tutulur.

### Çalışma Kuralları

- Git ile sürüm kontrolü; `main` korumalı, özellikler `feature/*` dalında geliştirilir.
- Commit mesajları anlamlı ve kısa (tercihen Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`).
- Kod değişikliği öncesi gereksinim/tasarım ile uyum kontrol edilir.
- Gizli bilgiler (anahtar, parola) repoya konmaz.
- Örnek/test görüntüleri küçük tutulur; büyük veri setleri repo dışında saklanır.
- Her aşama sonunda bu dosyadaki "Konuşma Notları" güncellenir.

## Önerilen Dizin Yapısı (taslak)

```
optes/
├── CLAUDE.md
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── requirements.md
│   ├── design.md
│   └── adr/
├── src/
├── tests/
└── data/          # örnek görüntüler (küçük)
```

## Konuşma Notları

### 2026-11-19
- Kullanıcı yeni bir proje başlatmak istedi; SDLC kurallarına uyulması istendi.
- Projenin ana amacı: **görüntü işleme uygulaması**.
- Talep: CLAUDE.md oluşturulması ve konuşmaların burada not olarak saklanması.
- İletişim dili: Türkçe.
- Sonraki adım: Açık soruların (dil, uygulama tipi, işlevler) netleştirilip gereksinim dokümanının yazılması.
- Kullanıcı netleştirdi: **mobil uygulama**, **Android + iOS**, tasarım **Ant Design**, backend **şimdilik yok**. Mobil bilgisi kısıtlı olduğundan mimari/tasarım Claude'a bırakıldı.
- Ürün amacı: ilk açılışta tam ekran kamera, nesneleri kutuya alıp küçük etiketle adını gösterme.
- Claude kararı: React Native + Expo + TypeScript, Vision Camera, TFLite (COCO), Skia overlay, Ant Design Mobile RN, EAS Build. Gerekçeler `docs/adr/0001-teknoloji-secimi.md` içinde.
- Kullanıcının durumu: fiziksel iPhone var, **Apple Developer hesabı yok ve şimdilik almak istemiyor**, Android cihaz yok. Expo Go gerçek zamanlı tespit için yetersiz.
- Karar: **Yol B**. Development build'i GitHub Actions macOS runner'da imzasız IPA olarak derleyip Sideloadly ile ücretsiz Apple ID'yle iPhone'a yüklemek. Yedek: Expo Go + TensorFlow.js yalnızca hızlı prototip için. Apple hesabı alınırsa EAS Build'e geçilir.
- Kullanıcı kararları: GitHub hesabı var. Uygulama adı **optes**. Apple ID'si yok/bilmiyor, oluşturma konusunda yardım istedi (yedek hesap önerildi).
- **Kota politikası:** GitHub Actions macOS dakikaları pahalı (özel repoda 10x). Her push'ta iOS derlemesi YAPILMAZ. iOS derleme workflow'u yalnızca elle tetiklenir (`workflow_dispatch`); lint/test ise Ubuntu runner'da çalışır. Kullanıcı adım adım ilerlemek istiyor, her değişiklik GitHub'a gönderilmez, birkaç adım birikince gönderilir.
- `git init` yapıldı (dal: `main`), `.gitignore` eklendi.
- Kullanıcı yedek bir Apple ID oluşturdu (kimlik bilgileri asla Claude'a verilmez, yalnızca Sideloadly'de girilir).
- **Expo iskeleti kuruldu:** Expo SDK 58, React Native 0.88, React 19, TypeScript. `app.json`: ad/slug `optes`, bundleId `com.optes.app` (ücretsiz imzada Sideloadly gerekirse değiştirir), iPad desteği kapalı. `npx tsc --noEmit` ve `expo-doctor` (20/20) geçti.
- **Önemli:** Expo SDK 58 benim bilgi tarihimden yeni. `AGENTS.md` kuralı: Expo/RN API'si yazmadan önce `https://docs.expo.dev/versions/v58.0.0/` ve `https://docs.expo.dev/llms.txt` okunur; paketler `npx expo install` ile kurulur. Vision Camera, fast-tflite, Skia ve Ant Design RN'nin SDK 58 / RN 0.88 uyumu kurulumdan önce doğrulanmalı.
- Oluşturulan dokümanlar: `docs/requirements.md`, `docs/adr/0001-teknoloji-secimi.md`.
