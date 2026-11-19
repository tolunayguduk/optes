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
- **GitHub'a gönderildi (2026-11-19):** https://github.com/tolunayguduk/optes (PUBLIC). Commit yazarı bu repo için GitHub noreply adresine çevrildi (`23317642+tolunayguduk@users.noreply.github.com`, yalnızca repo-yerel git config; global ayara dokunulmadı). Uzaktaki "Initial commit" (yalnızca README.md) kullanıcının GitHub hesabından geldi ve Gmail adresini taşıyor (hesapta "Keep my email private" kapalı); yerel geçmiş bunun üstüne rebase edildi. Bu e-posta repoda zaten görünür durumda; çözüm: GitHub'da ayarı açmak ve istenirse yeni repoda geçmişi yeniden yazmak (kullanıcı kararı).
- **İlk cihaz denemesi (2026-11-20):** iOS derlemesi (GitHub Actions) başarılı, Sideloadly ile iPhone'a yüklendi (iPhone 12 Pro Max sınıfı, iOS 27.0.1). Uygulama açıldıktan ~3 sn sonra çöküyor: `EXC_CRASH/SIGABRT`, crash thread `async-runner-1` (Vision Camera'nın async runner worklet thread'i), `HybridNativeThreadSpec.runOnThread` içinde yakalanmamış C++ istisnası = `runAsync` gövdesinde yakalanmamış JS hatası. Hatanın metni raporda yok. **Düzeltme (tanı amaçlı):** `runAsync` gövdesi `try/catch` + adım izleme (`resize/copy/inference/decode/publish`) ile sarıldı; hata `scheduleOnRN` ile arayüze iletilir ve ekranın üstünde kırmızı bantta gösterilir (`detector.status === 'error'`). Bir sonraki derlemede bantta hata metni görülecek. Not: kullanıcı IPA'yı bundle ID `com.optes.app.<takı>` ile imzaladı (Sideloadly otomatik ekledi).
- **İkinci cihaz denemesi (2026-11-20):** hata bandı sonrası uygulama ÇÖKMÜYOR, kamera açılıyor; ama hiç tespit/kutu görünmüyor ve hata bandı da yok. **Ana şüphe (doğrulanmadı):** `onFrame` worklet'i `tflite.state`/`resizerState.state` değerlerini oluşturulduğu andaki hâliyle yakalamış olabilir (model yüklense de worklet hep 'loading' görüyor, kareler sessizce atlanıyor). Diğer ihtimaller: köprü (`scheduleOnRN`) sessizce başarısız, çıkarım sonucu boş/uyumsuz, overlay çizmiyor. **Tanı şeridi eklendi** (`options.diagnostics`, geçici; CameraScreen'de açık): `createSynchronizable` sayaçları (frames/notReady/busy/done/jsReceived/detections/topScore, worklet'in gördüğü durum, model tensör şekilleri) ekranın altında. Sorun çözülünce `diagnostics: true` kaldırılacak.
- **Üçüncü cihaz denemesi (2026-11-20 00:38):** tanı şeridi sürümü de ÇÖKTÜ, aynı imza (SIGABRT, `async-runner-1`, `HybridNativeThreadSpec.runOnThread` içinde yakalanmamış C++ istisnası), açılıştan ~0,8 sn sonra. **Çıkarım:** `runAsync` gövdesindeki `try/catch` istisnayı yakalayamadı; yani istisna benim kodumun dışında (async runner mekanizması / closure aktarımı: `createAsyncRunner.js` içinde bilinen bir "TODO: WorkletsError ... cannot be sent to the UI runtime" yorumu var). Tanı şeridi hiç görülemedi. **Karar:** `AsyncRunner` kullanımı kaldırıldı; kare işleme doğrudan `useFrameOutput.onFrame` içinde (kameranın worklet thread'i) yapılıyor, her adım try/catch + korumalı hata bildirimi + kare her koşulda dispose. Bu hâlâ doğrulanmadı; çökerse sıradaki şüpheli `onFrame` closure'ındaki yakalanan nesneler (hybrid objeler, `model` adaptörü) ve `scheduleOnRN`.
- **Hızlı iterasyon (2026-11-20):** Derlemeler 6/6/15 dk sürdü; asıl yavaşlık tetikle-bekle-indir-yükle döngüsü. Kullanıcı isteğiyle `expo-dev-client` eklendi (`npm start` = `expo start --dev-client`, `scheme: optes`), workflow'a `configuration` girdisi (Debug/Release), `RCT_USE_PREBUILT_RNCORE=1` ve CocoaPods + derleme önbelleği eklendi. Debug IPA bir kez yüklenir, sonra JS değişiklikleri Metro ile (aynı Wi-Fi, port 8081) saniyeler içinde gelir. Kazancın büyüklüğü ve prebuilt çekirdeğin RN 0.88.1 için çalıştığı henüz doğrulanmadı. Rehber: `docs/build-ios.md`.
- **Cihazda tespit ÇALIŞTI (2026-11-20, dev client + Metro, `http://<bilgisayar-IP>:8081`):** kutu ve etiket görünüyor. Kullanıcı geri bildirimi: "kutucuklar fazla titriyor, ne olduğu okunmuyor". **Yapıldı:** `src/detection/tracker.ts` (kareler arası izleme: EMA kutu yumuşatma 0.35, etiket oylama, `minHits=2` hayalet filtresi, `holdMs=350` kaçan tespitleri tutma; saf, zaman dışarıdan) + `useSmoothedResult` (motor bağımsız) + overlay etiketi koyu zemin/14px/solda renkli şerit, kutu 3px. Tanı şeridi yalnızca `__DEV__`. 26 test geçiyor. Henüz cihazda denenmedi; ayarlar (`smoothing`, `holdMs`, `minHits`) cihaz denemesine göre ince ayarlanacak. Not: ağ 172.20.10.x (iPhone hotspot/USB tethering), Windows ağ profili Public.
- **Kutu konumu hatası (2026-11-20):** kullanıcı: "kutu başka yerde, nesne başka yerde" (titreme azaldı). Neden henüz KESİN DEĞİL; en olası: kare yönü/görüş alanı varsayımlarım (upright swap + `cover` matematiği) yanlış. **Düzeltme denemesi:** `enablePhysicalBufferRotation: true` (kare dik gelir), kare->kamera afin dönüşümü 3 noktayla `frame.convertFramePointToCameraPoint` ile worklet'te çıkarılıp `DetectionFrame.frameToCamera` ile gönderilir; overlay `CameraRef.convertCameraPointToViewPoint` ile ekran koordinatına çevirir (`frameRectToViewRectViaCamera`, 4 birim test); hata olursa eski `cover` hesabına düşer. Tanı şeridine `frame WxH yön mir cam0 axX axY` satırı eklendi. 30 test geçiyor. Cihazda denenmedi.
- **Kutu konumu, ekran görüntüsü analizi (2026-11-20 01:17):** Şerit: `frame 1080x1920 up mir=0 cam0=0,0 axX=1,0 axY=0,1` => kare dik, kare->kamera dönüşümü birebir; dönüşüm zinciri doğru görünüyor. Gözlem: fincanın MERKEZİ doğru ama kutu ~yarı genişlik, ~1,8x yükseklikte; üstteki şişe kutusu merkezden ~2x uzak; skorlar düşük (en yüksek 0,60, fincan `bowl 52%`). Çıkarım (kanıtsız): modelin gördüğü görüntü (resizer çıktısı) beklenenden farklı olabilir (yön/letterbox/ters). **Tanı eklendi:** modelin girdisi 60x60 BMP olarak şeritte gösterilir (her 20 karede; `debugImage.ts`, test edildi) + en iyi ham tespit (model uzayı). 35 test geçiyor. `@types/node` devDependency + tsconfig `types: [jest, node]`. Sonuç cihazda bekleniyor.
- **KUTU KONUMU HATASININ NEDENİ BULUNDU (2026-11-20 01:20, ekran görüntüsü + küçük görüntü):** modelin girdisi DOĞRU (dik, yanlarda siyah bant), model çıktısı DOĞRU (şişe `x=.51 y=.30 w=.13 h=.38`). Hata, kameranın `frame.convertFramePointToCameraPoint` + `CameraRef.convertCameraPointToViewPoint` zincirindeydi: `enablePhysicalBufferRotation: true` iken frame->camera dönüşümü birebir (identity) dönüyor, ama preview dönüşümü kamera noktalarını SENSÖRÜN yatay yönünde bekliyor; çizilen kutu, noktaların 90° dönük verilmesiyle yapılan hesapla (x 207..549, y 829..1198) birebir tuttu (gerçek çizim x 205..545, y 825..1175). **Çözüm:** kamera dönüşümü ve `frameToCamera` tamamen kaldırıldı; `cover` matematiği (`frameRectToViewRect`) kullanılıyor (elle hesap: x 385..593, y 480..1088, gerçek şişeyle uyumlu). `enablePhysicalBufferRotation: true` KALDI (kare dik, 1080x1920). Gerçek cihaz değerleriyle gerileme testi eklendi (`pipeline.test.ts`). 33 test hedefi. Cihazda henüz doğrulanmadı. Önceki (physical rotation=false) denemedeki sorunun nedeni bilinmiyor; muhtemelen yön/resizer kombinasyonu. DERS: bir kütüphane fonksiyonunun koordinat uzayı varsayımı belgede net değilse önce cihazda ölç.
- **Kutular oturdu (2026-11-20 01:24); yeni sorunlar:** tek şişe 3 parça kutuya bölünüyor (2 `bottle` + 1 `cup`), kalabalıkta (poster/ekrandaki insanlar) iç içe çok sayıda `person` kutusu, `detections=10` üst sınırı doluyor. Neden: SSD v1 (2018) uzun/dar nesneyi parçalıyor + modelin yerleşik NMS'i gevşek + takipçi parçaları `holdMs` ile tutuyor. **Yapıldı:** (1) `nms.ts` `suppressOverlaps` (IoU>=0.5 etiketten bağımsız; AYNI etiketli ve küçük kutunun >=%80'i büyüğün içindeyse), farklı etiketli iç içe korunur (masa+fincan); tracker hem gelen tespitlere hem gösterilen izlere uygular; (2) model **EfficientDet-Lite0**'a geçirildi (`models/efficientDetLite0.ts`, 320x320 uint8, Apache 2.0, `assets/models/README.md`); çıktı sırası güvenilir okunamadığı için `efficientDetDecode.ts` çıktıları ŞEKİL/DEĞERE göre tanır; etiketler 90'lık, offset YOK (0=person; SSD'de offset 1 vardı); `maxResults` varsayılanı 20. Eski modele dönüş: `src/detection/index.ts` tek satır. 47 test geçiyor. **Cihazda doğrulanmadı:** özellikle EfficientDet çıktı tanıma ve etiket doğruluğu (cup/bottle gibi bilinen nesnelerle kontrol et).
- **Nesne seçimi (2026-11-20, kullanıcı isteği: "kişi nesneyi kendi seçebilsin"):** `ObjectPicker` (sol üstte "Tüm nesneler / kişi / N nesne seçili" düğmesi -> alt panel: Tümü, Yalnızca kişi, arama kutusu, AntD `Tag` çipleri; RN `Modal`) + `filterByLabels` (saf, testli; filtre tracker/NMS'ten ÖNCE) + tracker `resetKey` (seçim değişince izler sıfırlanır). Motor sözleşmesine `ObjectDetector.labels` ve adaptöre `TfliteDetectorModel.labels` eklendi. Türkçe nesne adları `src/i18n/labels.tr.ts` (`LABEL_LANGUAGE='tr'|'en'` tek sabit; overlay etiketleri de Türkçe; her model etiketinin karşılığı testle zorunlu). Seçim KALICI DEĞİL (uygulama kapanınca "Tümü"); kalıcılık için native modül (AsyncStorage/expo-file-system) gerekir, yeniden derleme ister. İkon fontu gerektirmemesi için AntD `Checkbox/SearchBar` kullanılmadı. 53 test geçiyor; cihazda denenmedi. Verimlilik notu: etikete göre filtre çıkarım hızını artırmaz (model tüm sınıfları hesaplar), kaliteyi artırır; gerçek hız kazancı özel kişi modeli/iOS Vision ile olur (ölçülmedi).
- **Yüz tanıma DENEMESİ (2026-11-20, kullanıcı: "kişiyi etiketle, başka fotoğrafında aynı kişi mi anla"; önerim kabul edildi: deneme, bellekte kayıt):** Bkz. `docs/adr/0003-yuz-tanima.md`. `src/face/`: BlazeFace (anchor 896 üretimi + çözüm + NMS), göz hizalaması (ArcFace 112x112), MobileFaceNet (128-d, iki girdi: yüz + aynalanmışı, ortalama), kosinüs eşleştirme (eşik 0.5, TAHMİN), `useFaceRecognizer` (5 kare/sn, kamera thread'i, try/catch+tanı), `useEnrollment` (5 örnek), UI: `ModeSwitch` (Nesne|Yüz), `FaceControls` (+Kişi ekle via `Alert.prompt` = yalnızca iOS, Kişiler listesi, rıza notu). Kayıtlı kişiler YALNIZCA BELLEKTE. 72 test geçiyor (anchor sayısı 896, hizalama, aynalama, çözüm, eşleştirme); iOS JS paketleme başarılı. **Cihazda HİÇ denenmedi:** BlazeFace çıktı düzeni/çözümü, [0,1] NCHW ön işleme, performans, eşik. **MobileFaceNet repoda DEĞİL** (lisans/eğitim verisi doğrulanmadı): `.gitignore`, `npm run models:face` (SHA-256 doğrulamalı), iOS workflow'unda derleme öncesi indirme adımı. BlazeFace (Apache 2.0) repoda. Yayın öncesi: lisans doğrulama/model değişimi, KVKK/GDPR rıza akışı, App Store yüz verisi şartları.
- **Ön kamera (2026-11-20, kullanıcı isteği):** `CameraFlipButton` (sol üst yığın: Mod, Nesne seç/Kişi ekle, Kamera çevir), `useCameraDevice(position)`; konum değişince tracker `resetKey`'i de değişir. Vision Camera: `mirrorMode` varsayılanı `auto` (ön kamera önizleme/çıktısı aynalı); `enablePhysicalBufferRotation: true` iken tampon da aynalanır ve `Frame.isMirrored` false beklenir (dokümandan; DOĞRULANMADI). Güvence: iki motorda `frame.isMirrored` true ise `mirrorRect` ile kutu x'i çevrilir (testli). Yüz parmak izi zaten düz+aynalı kopyanın ortalaması olduğu için aynalamaya büyük ölçüde dayanıklı olmalı (beklenti). Tanı şeridinde `mir=` değeri var: ön kamerada 0 mı 1 mi görülmeli. 75 test geçiyor; cihazda denenmedi.
- ~~Sıradaki: GitHub reposu oluşturup push~~ (yapıldı) — **Sıradaki:** ilk macOS derlemesini elle tetikle, Sideloadly ile yükle. Eski not: GitHub reposu oluşturup push (kullanıcı onayıyla; public/private seçimi kota için önemli), ilk macOS derlemesi, Sideloadly ile iPhone'a yükleme, cihazda varsayımların doğrulanması.
- Oluşturulan dokümanlar: `docs/requirements.md`, `docs/adr/0001-teknoloji-secimi.md`.
