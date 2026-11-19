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
| Kamera | `react-native-vision-camera` **v5** (Nitro tabanlı; `useFrameOutput`) |
| Nesne tespiti | On-device TFLite, COCO (80 sınıf) modeli, `react-native-fast-tflite` v3 ile |
| Kutu/etiket çizimi | `@shopify/react-native-skia` overlay (kamera üstünde) |
| Frame işleme | `react-native-vision-camera-worklets` + `react-native-worklets` (ayrı worklet runtime), kare boyutlandırma: `react-native-vision-camera-resizer` |
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
- **Uyum araştırması sonucu (2026-11-19):** Vision Camera artık v5 (v4 değil), `worklets-core` gerekmiyor. Kurulan paketler: vision-camera 5.2.4, nitro-modules, nitro-image, vision-camera-worklets, vision-camera-resizer, fast-tflite 3.0.1, worklets (Expo SDK 58 sürümü). `expo-doctor` tek uyarı: fast-tflite "New Architecture'da test edilmemiş" (dizin metadatası; paket Nitro tabanlı. **Gerçek cihazda doğrulanacak**). Skia ve Ant Design RN henüz kurulmadı (reanimated, gesture-handler, safe-area-context, icons gerektirir; Skia >=0.7 worklets + reanimated >=4 ister).
- **Windows kısıtı:** `expo prebuild --platform ios` Windows'ta çalışmaz; iOS yapılandırması ancak CI'da (macOS) doğrulanır. Android prebuild yerelde config eklentilerini doğrulamak için kullanılabilir (çıktı `android/` silinir).
- **Yapıldı:** `app.json` (kamera izin metni TR, fast-tflite eklentisi + CoreML delegate), `metro.config.js` (`.tflite` asset), `src/screens/CameraScreen.tsx` (tam ekran kamera, izin akışı + "Ayarlara git", arka plana alınınca kamera durur/döner), `App.tsx`.
- **Tespit katmanı yapıldı (2026-11-19):** `src/detection/` altında. Kullanıcı isteği: model/motor ileride değişebilir, adaptörle soyutlanmalı. Bkz. `docs/adr/0002-tespit-soyutlamasi.md`. Seçim noktası `src/detection/index.ts`; ekranlar yalnızca `useObjectDetector()` kullanır. İlk model: `coco_ssd_mobilenet_v1_quant.tflite` (Apache 2.0, 4,2 MB, `assets/models/`). MediaPipe EfficientDet/SSD modelleri ham anchor çıktısı verdiği için elendi.
- **Testler:** Jest + jest-expo, 13 test geçiyor (`npm test`): geometri dönüşümleri ve çıktı çözücü. `tsc --noEmit` temiz. iOS JS paketleme (`expo export`) başarılı. TS 6'da `@types` otomatik yüklenmez, `tsconfig.json` içinde `"types": ["jest"]` var.
- **Cihazda doğrulanması GEREKEN varsayımlar (henüz hiçbiri denenmedi):** (1) `Frame.width/height` sensör yönündedir ve `orientation` left/right ise dik boyut yer değiştirir (dokümanda net değil), (2) Resizer `contain` + rotasyon düzeltmesi beklenen şekilde, (3) Camera önizlemesi `cover` modunda (kutu hizalaması buna dayanıyor), (4) fast-tflite New Architecture'da çalışıyor, (5) FPS hedefi (NFR-2).
- **Overlay + Ant Design yapıldı:** `src/components/DetectionOverlay.tsx` düz React Native `View` ile kutu ve etiket çiziyor (Skia kullanılmadı: en fazla 10 kutu; reanimated'e zaten AntD RN'in peer'i olarak sahibiz ama Skia gereksiz; ADR-0001'deki Skia kararı terk edildi). Renkler AntD paletinden (`src/theme.ts`), etiket "person 87%" biçiminde. `App.tsx` AntD `Provider`, `GestureHandlerRootView`, `SafeAreaProvider` ile sarılı; izin ekranı AntD `Button` kullanıyor. İkon kütüphanesi (`@ant-design/icons-react-native`) kurulu ama font bağlama gerektirdiği için kullanılmıyor. 16 test geçiyor.
- **CI yapıldı:** `.github/workflows/ci.yml` (Ubuntu, push main + PR: typecheck + test) ve `ios-unsigned-ipa.yml` (macOS, SADECE `workflow_dispatch`, 60 dk zaman aşımı). Rehber: `docs/build-ios.md`. Workflow'lar henüz GitHub'da hiç çalıştırılmadı; macOS adımı (Xcode sürümü, pod install, scheme adı `optes`) doğrulanmadı.
- **Sıradaki:** GitHub reposu oluşturup push (kullanıcı onayıyla; public/private seçimi kota için önemli), ilk macOS derlemesi, Sideloadly ile iPhone'a yükleme, cihazda varsayımların doğrulanması.
- Oluşturulan dokümanlar: `docs/requirements.md`, `docs/adr/0001-teknoloji-secimi.md`.
