# iOS derleme ve iPhone'a yükleme (ücretsiz Apple ID ile)

## Hızlı geliştirme: Debug (geliştirme istemcisi) + Metro

Her JS değişikliği için yeniden derlemek yavaştır. Bunun yerine **bir kez** Debug derlemesi yükleyip kodu bilgisayardan canlı yükleriz:

1. Actions > **iOS imzasız IPA** > Run workflow > `configuration: Debug`. Çıkan `optes-Debug-unsigned.ipa`'yı aşağıdaki 2. bölümdeki gibi Sideloadly ile yükle (bir kez).
2. Bilgisayarda `npm start` (= `expo start --dev-client`) çalıştır. iPhone ve bilgisayar **aynı Wi-Fi'da** olmalı.
3. Windows Güvenlik Duvarı sorarsa Node.js için **özel ağlarda** izin ver (port 8081).
4. iPhone'da uygulamayı aç. İlk açılışta "yerel ağ" iznini ver. Açılış ekranında **Enter URL manually** de ve terminalde yazan adresi gir (örn. `http://192.168.1.20:8081`).
5. Bundan sonra JS/TS dosyasını kaydedince uygulama saniyeler içinde güncellenir. Hata mesajları ve `console.log` çıktıları terminalde görünür.

Yeniden derleme gerekir: yeni native paket, `app.json` izin/eklenti değişikliği, 7 günlük imza süresinin dolması.

Önbellek: workflow CocoaPods ve derleme çıktısını önbelleğe alır; ardışık derlemeler daha kısa sürmelidir (ölçülmedi).


> Durum: **henüz hiç denenmedi.** İlk derlemede Xcode/CocoaPods hataları çıkabilir; hatayı birlikte gideririz.

## 1. IPA derleme (GitHub, macOS runner)

macOS dakikaları kotadan 10 kat hızlı düşer; bu yüzden workflow yalnızca elle çalışır.

1. Kodu GitHub'a gönder (`git push`).
2. GitHub > **Actions** > **iOS imzasız IPA** > **Run workflow**.
3. Bitince (yaklaşık 15-30 dk) sayfanın altındaki **Artifacts** bölümünden `optes-unsigned-ipa` indir, zip'ten `optes-unsigned.ipa` çıkar. Artifact 7 gün saklanır.

Kota ipucu: Herkese açık (public) repoda Actions ücretsizdir. Özel repoda aylık ücretsiz dakikayı macOS 10x tükettiği için yaklaşık 200 macOS dakikası eder.

## 2. Sideloadly ile imzala ve yükle (Windows)

Hazırlık: iTunes ve iCloud'un **Apple'ın sitesinden** indirilen sürümü kurulu olmalı (Microsoft Store sürümü değil). Sideloadly'yi yalnızca sideloadly.io'dan indir.

1. iPhone'u USB ile bağla, "Bu bilgisayara güven" de.
2. iPhone > Ayarlar > Gizlilik ve Güvenlik > **Geliştirici Modu**'nu aç (telefon yeniden başlar).
3. Sideloadly'de `optes-unsigned.ipa`'yı seç, **yedek Apple ID**'ni gir, Start'a bas.
   - İstenirse uygulamaya özel parola veya 2FA kodu gir. Parolayı yalnızca Sideloadly'ye yaz.
4. iPhone > Ayarlar > Genel > **VPN ve Aygıt Yönetimi** > Apple ID'ni "Güven" olarak işaretle.
5. Uygulamayı aç, kamera iznini ver.

## Kısıtlar

- Ücretsiz imza **7 gün** geçerli; süre dolunca uygulama açılmaz, 2-4. adımları tekrarla (veri kaybı yok).
- Aynı anda en fazla **3** uygulama imzalanabilir.
- Bundle ID (`com.optes.app`) başka biri tarafından alınmışsa Sideloadly farklı bir ID ister/üretir; sorun değil.
