# Gereksinimler (v0.1, taslak)

## Fonksiyonel

| ID | Gereksinim | Öncelik |
|---|---|---|
| FR-1 | Uygulama açıldığında tam ekran kamera önizlemesi gösterilmeli | Zorunlu |
| FR-2 | İlk açılışta kamera izni istenmeli; reddedilirse açıklayıcı bir ekran ve "Ayarlara git" butonu gösterilmeli | Zorunlu |
| FR-3 | Canlı görüntüdeki nesneler tespit edilmeli | Zorunlu |
| FR-4 | Her nesne bir kutu ile çevrelenmeli | Zorunlu |
| FR-5 | Her kutunun üzerinde küçük bir etiket (nesne adı + güven yüzdesi) olmalı | Zorunlu |
| FR-6 | Güven skoru eşiğinin altındaki tespitler gösterilmemeli (varsayılan eşik 0.5) | Zorunlu |
| FR-7 | Uygulama arka plana alınıp geri gelince kamera kaldığı yerden devam etmeli | Zorunlu |
| FR-8 | Ön/arka kamera geçişi | İsteğe bağlı |
| FR-9 | Etiketlerin Türkçe gösterimi | Yapıldı (`src/i18n/labels.tr.ts`) |
| FR-10 | Kullanıcı hangi nesnelerin gösterileceğini seçebilmeli | Yapıldı (cihazda denenmedi) |
| FR-11 | Kullanıcı bir kişiyi adıyla kaydedip sonra aynı kişiyi tanıyabilmeli (yüz tanıma) | Deneme (ADR-0003) |
| FR-12 | Yüz verisi yalnızca cihazda tutulmalı; kayıt öncesi rıza/gizlilik notu gösterilmeli | Deneme |
| FR-13 | Kayıtlı kişiler uygulama kapanınca korunabilmeli | Açık (native depolama gerekir) |

## Fonksiyonel Olmayan

| ID | Gereksinim |
|---|---|
| NFR-1 | Tespit tamamen cihaz üzerinde çalışmalı, internet gerekmemeli |
| NFR-2 | Orta seviye cihazda hedef en az 15 FPS tespit, kamera önizlemesi akıcı |
| NFR-3 | Kutular nesne üzerinde doğru konumda görünmeli (dikey/yatay yönde, farklı ekran oranlarında) |
| NFR-4 | Kamera görüntüsü cihazdan dışarı gönderilmemeli, saklanmamalı (gizlilik) |
| NFR-5 | Android ve iOS'ta aynı davranış |
| NFR-6 | Arayüz Ant Design ilkelerine uymalı |

## Kapsam Dışı (şimdilik)

- Backend, kullanıcı hesapları, bulut senkronizasyonu
- Fotoğraf/video kaydetme ve galeriden görsel yükleme
- Özel (kullanıcı eğitimli) model

## Kabul Kriterleri (ilk sürüm, MVP)

1. Uygulama açılır açılmaz kamera tam ekran görünür.
2. Kamera karşısına konan bir fincan, telefon, kişi vb. COCO nesnesi kutu ve doğru etikletle gösterilir.
3. Telefon döndürülünce kutular nesneyle hizalı kalır.
4. Android ve iOS'ta gerçek cihazda çalışır.
