# ADR-0003: Yüz tanıma (deneme / spike)

- **Durum:** Deneme (cihazda doğrulanmadı)
- **Tarih:** 2026-11-20

## Bağlam

Kullanıcı bir kişiyi kameraya gösterip etiketlemek, sonra başka bir fotoğrafında aynı kişi olup olmadığını anlamak istiyor.
Backend yok; her şey cihazda. Bu, nesne tespitinden farklı bir iştir ve biyometrik veri içerir.

## Karar

Hat (hepsi cihazda, `fast-tflite` ile; yeni native paket YOK, Metro ile denenebilir):

1. Kare iki boyuta indirilir (GPU, `contain`): 128x128 (yüz bulma) ve 1024x1024 (yüz kırpma).
2. **BlazeFace short-range** (MediaPipe, Apache 2.0): yüz kutusu + 6 anahtar nokta. Ham anchor çıktısı olduğu için
   anchor üretimi (`anchors.ts`, 896) ve çözüm + NMS (`blazeFace.ts`) bizde.
3. Göz noktalarından **benzerlik dönüşümüyle hizalanmış 112x112 kırpma** (`align.ts`, ArcFace şablonu), büyük kopyadan.
4. **MobileFaceNet** (Qualcomm AI Hub TFLite): 128 boyutlu parmak izi. Model iki girdi alır; aynı yüzü ve aynalanmışını verip
   iki parmak izinin ortalaması alınır.
5. Eşleştirme JS'te: kosinüs benzerliği, kişi başına en yüksek skor, eşik altı "Bilinmeyen" (`gallery.ts`, varsayılan 0.5).
6. Kayıt: ~5 kare (≈1 sn) örnek toplanır; aynı adla tekrar kayıt örnekleri ekler.

Arayüz: `Nesne | Yüz` modu; yüz modunda "+ Kişi ekle" ve "Kişiler" listesi. Sonuçlar, takip/overlay hattında nesne tespitiyle
aynı `DetectionFrame` biçimine çevrilir (`faceResult.ts`).

## Gizlilik ve hukuki notlar

- Yüz parmak izi biyometrik veridir (KVKK md. 6, GDPR md. 9: özel nitelikli veri, açık rıza). Bu aşamada veri **yalnızca bellekte**
  tutulur, uygulama kapanınca silinir, cihazdan çıkmaz. Kişi eklerken ekranda rıza/gizlilik notu gösterilir.
- Başkalarının yüzü yalnızca kişinin rızasıyla kaydedilmelidir. Uygulama yayınlanacaksa: rıza akışı, gizlilik politikası ve
  App Store'un yüz verisi şartları yeniden değerlendirilmeli (doğrulanmadı; hukuki görüş gerekir).
- Bu sistem **güvenlik/kimlik doğrulama amacıyla kullanılmamalıdır**: ışık, açı, maske, benzer yüzler ve ikizlerde hata yapar.

## Model lisansları

| Model | Durum |
|---|---|
| BlazeFace short-range | Apache 2.0 (MediaPipe). Repoda. |
| MobileFaceNet (Qualcomm AI Hub) | Hugging Face sayfası `apache-2.0` etiketliyor, ancak asıl uygulama (foamliu/MobileFaceNet) lisansı ve **eğitim verisi doğrulanmadı**. Bu yüzden repoya konmaz; `npm run models:face` ile indirilir (SHA-256 doğrulamalı). **Yayından önce yeniden değerlendirilmeli veya lisansı net bir modelle değiştirilmeli.** |

## Bilinen sınırlar / riskler

- Yüz kırpması 1024x1024 "contain" kopyadan alınır (dikey karede içerik ~576x1024). Uzak/küçük yüzler düşük çözünürlüklü olur;
  kamera yüze yakınken (selfie mesafesi) tasarlandı.
- Eşik (0.5) tahmindir; gerçek denemelerle (aynı kişi / farklı kişi benzerlikleri) ayarlanmalıdır. Overlay'de benzerlik % olarak görünür.
- Ağır iş: ~5 kare/sn, işlem başına süre tanı şeridinde (`süre=...ms`). Ölçülmedi.
- Doğruluk, hat (BlazeFace çözümü, hizalama, ön işleme: [0,1] RGB NCHW) cihazda doğrulanana kadar bilinmiyor.
- Kalıcı depolama yok (native modül + yeniden derleme gerekir).

## Alternatifler

Tüm vücut yeniden tanıma (kıyafet temelli): güvenilmez, elendi. iOS Vision çerçevesi: yüz bulur ama tanıma/parmak izi sunmaz.
