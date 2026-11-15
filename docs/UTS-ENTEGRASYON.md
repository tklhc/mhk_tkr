# ÜTS → Teknik Resim köprüsü

Teknik Resim uygulaması, bir iş emrinin yazısını **bağlantıyla** alabilir:

```
https://<uygulama-adresi>/#ie=<base64url(UTF-8 iş emri yazısı)>
```

Bağlantı açılınca **İş emrinden resim çiz** penceresi, okunan değerler ve uyarılarla birlikte açılır.
Kullanıcı **Resmi çiz** demeden hiçbir şey çizilmez.

## Güvenlik ve gizlilik

- Veri adresin `#` kısmında taşınır: sunucuya gönderilmez, sunucu günlüğüne düşmez.
- Yazı yalnızca iş emri okuyucusundan geçer (sayı/etiket çıkarır); çalıştırılmaz, sayfaya HTML olarak basılmaz.
- Kontrol karakteri içeren, bozuk ya da ~12 000 karakterden uzun bağlantılar reddedilir.
- Uygulama ve ÜTS ayrı adreslerde çalışır; tarayıcı verileri (kütüphane, taslak, firma ayarı) birbirine karışmaz.

## ÜTS tarafında yapılacak (BU DEPO UYGULAMAZ)

Canlı ÜTS'ye dokunmak her seferinde ayrı onay ister; bu yüzden aşağıdaki ekleme **yapılmadı**, yalnızca alıcı taraf hazır.
İş emri kağıdı sayfasına bir "Teknik resim" düğmesi eklenirse yeterli olan kod:

```js
// iş emri kağıdında görünen yazı (PDF/yazdır önizlemesindeki metinle aynı satırlar)
function teknikResimAc(isEmriMetni) {
  const bayt = new TextEncoder().encode(isEmriMetni);
  const b64 = btoa(String.fromCharCode(...bayt))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  window.open(`${TEKNIK_RESIM_ADRESI}#ie=${b64}`, "_blank", "noopener");
}
```

`TEKNIK_RESIM_ADRESI`: uygulamanın yayın adresi (GitHub Pages ya da kendi sunucunuz).

## ÜTS'ye dokunmadan deneme

```bash
node scripts/ie-baglantisi.mjs is-emri.txt http://localhost:5173/
```

Çıkan bağlantıyı tarayıcıda açın. `is-emri.txt`: ÜTS iş emri kağıdının yazısı (PDF'den kopyalanan metin).

## Yapılamayanlar (ÜTS tarafında geliştirme gerekir)

- **ÜTS'den ya da ÜTS'ye veri çekme/gönderme** (API): uygulamada sunucu yok, kimlik doğrulama yok.
- **Çizimi iş emrine otomatik ekleme:** çizim PNG/PDF olarak indirilip ÜTS'de ekran/dosya yoluyla eklenir.
