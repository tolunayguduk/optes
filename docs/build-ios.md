# iOS derleme ve iPhone'a yükleme (ücretsiz Apple ID ile)

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
