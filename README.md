# MİHENK Teknik Resim

Kesici takımlar (freze, matkap, kademeli matkap…) için parametrik teknik resim uygulaması.
Parametrelerden ISO çizgi/ölçü kurallarına uygun yan görünüş, uç görünüş, ISO 7200 antet, DXF, PDF/SVG/PNG ve Excel rapor üretir. Sayfa gerçek mm ölçeğindedir (A4/A3); çıktılar kağıtta ölçek yazdığı gibi çıkar.

Canlı: https://tklhc.github.io/mhk_tkr/

## Geliştirme

Node 20+ gerekir.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # birim testleri (vitest)
npm run lint       # eslint, uyarıya izin yok
npm run build      # dist/index.html: tek dosya, internetsiz de açılır
```

## Yapı

| Klasör | İçerik |
|---|---|
| `src/geometry/profil.js` | **Takım geometrisinin tek kaynağı.** İstasyonlar (sap, geçiş, boğaz, kesici), kademeler, kontur (doğru + yay), görünür kenarlar ve girdi doğrulaması. mm cinsinden; x ekseni sap ucundan takım ucuna. |
| `src/drawing/` | SVG çizim: `Sayfa` (kağıt, çerçeve), `YanGorunus`, `UcGorunus`, `Antet` (ISO 7200 + veri tablosu + QR), `iso.jsx` (çizgi, ok, ölçü, kılavuz), `sayfaDuzeni.js` (kağıt/ölçek) |
| `src/geometry/tolerans.js` | ISO 286 tolerans tabloları (h6, js7, e8, H7 … → sayısal sapma) |
| `src/config.js` | Firma bilgileri (antette görünür) |
| `src/ui/` | Parametre paneli, takım kütüphanesi, girdi bileşenleri |
| `src/io/` | DXF, CSV içe aktarma (UTF-8 ve Windows-1254, tırnak/ondalık virgül), Excel çıktı, `export.js` (SVG/PNG/PDF) |
| `src/view3d/` | 3D önizleme (Three.js) |
| `src/assets/` | Logo |
| `tests/` | Geometri ve DXF testleri |

Yeni bir takım tipi önce `profil.js`'e eklenir; yan görünüş, DXF ve 3D ölçüleri oradan alır.

## Yayın

`main`'e her push'ta GitHub Actions lint + test + derleme yapar ve `dist/`'i GitHub Pages'e yayınlar
(`.github/workflows/yayin.yml`). Diğer dallarda ve PR'larda yalnız kontrol çalışır.

## Arayüz

- **Sol panel**, dört sekme: *Takım* (ölçüler, geometri, sap, soğutma), *Resim* (sayfa, nelerin gösterileceği, notlar, damga), *Belge* (antet bilgileri, müşteri, paylaşım), *Kütüphane*.
- Sayı alanlarında ondalık için virgül ya da nokta, ↑/↓ ile adım (Shift ×10, Alt ×0,1) kullanılır. Hatalı alan kırmızı olur, *Takım* sekmesinde uyarı sayısı görünür.
- Üstte **Veri** (CSV içe aktar, şablon, Excel raporu, örnek takımlar) ve **Dışa aktar** (PDF, PNG, SVG, DXF) menüleri.
- Çalışma **otomatik kaydedilir** (bu tarayıcıda); sayfa yenilenince kaldığınız yerden devam edersiniz. **+ Yeni** boş resim açar.
- Yakınlaştırma: sağ alttaki düğmeler, Ctrl + tekerlek ya da iki parmak; yakınlaştırınca fareyle sürükleyerek kaydırılır.

## İş emrinden resim çizme

**Veri → İş emrinden resim çiz…** ÜTS iş emrinin PDF'ini (ÜTS'de Yazdır → PDF olarak kaydet) ya da yazısını alır, takım tipini ve üretim ölçülerini okur, onay penceresinde ne okunduğunu gösterir; "Resmi çiz" ile resmi kurar.

- Okunanlar: takım tipi ve kodu, İE no, Takım/Çap, Şaft Çapı, Takım Boyu, Helis Boyu / Kesici Boy, Ağız Sayısı, Helis Açısı, Çekirdek Çapı, Köşe Pahı / Köşe Radyusu, Uç Açısı, rayba pah genişliği, müşteri, teslim, kalite, kaplama. Alan adları ÜTS takım tipi şablonlarıyla (`takim-tipleri-defaults.js`) aynıdır.
- Çizilmeyen taşlama verileri (kesme açısı, yüzey genişlikleri, alın açıları…) sayfada **Üretim özellikleri** tablosu olarak yer alır.
- **Uydurma yok:** iş emrinde olmayan değer (tolerans, helis/kesim yönü, kademe ve konik rayba ölçüleri, T-freze boğazı) varsayılan/boş bırakılır ve onay penceresinde uyarı olarak yazılır.
- Resim dosyaları (PNG/JPG) okunmaz: OCR ile sayı okumak yanlış ölçü riski taşır. Taranmış (metin katmanı olmayan) PDF'ler de okunamaz.
- Dosya yalnız tarayıcıda işlenir, hiçbir yere gönderilmez.

## Diş profili detayı ve salgı işareti

- **Diş profili detayı** (yalnız *İş emri çizimi*): uçtan kesitte bir dişin kesici kenarı büyütülmüş çizilir. İş emrinden `Kesme Açısı`, `1./2. Serbest Yüzey Gen.` ve `1./2.Alın SY. Açısı` okunur; değerler *Takım → Diş profili detayı* alanlarından da elle girilir (0 = girilmedi). Kesme açısı ve 1. serbest yüzey (genişlik + açı) birlikte yoksa detay çizilmez, uydurma değer kullanılmaz. Açılar ve genişlikler ölçeklidir; kanal tabanı ve arka duvar şematiktir. Etiketlerin yorumu (kesme açısı = talaş açısı γ, Alın SY açısı = serbest yüzey açısı) içe aktarırken uyarı olarak yazılır.
- **Salgı** (*Takım → Salgı toleransı*): girilen salgı toleransı için sap üstüne A datumu ve kesici kısma tolerans çerçevesi konur. Değeri kullanıcı yazar.
- Yan görünüş, detaylar, uçtan görünüş, kesit ve bu işaret çizim üzerinde tutulup **sürüklenebilir**; konumlar dosyayla birlikte kaydedilir.

## Arayüz ek özellikleri

- **Tema:** araç çubuğundaki güneş/ay düğmesiyle koyu ve açık tema (tercih bu tarayıcıda saklanır). 3B görünüm de temaya uyar.
- **3B:** ortam yansıması (metal yüzeyler) ve yumuşak kenarlı zemin üzerinde gölge. Görsel dosya gerekmez, ortam kodla üretilir.
- **Yardım:** `?` tuşu ya da araç çubuğundaki ? düğmesi kısayolları ve ipuçlarını açar.
- **Yazı çakışması:** durum çubuğunda sayı olarak görünür, çizimde kırmızı kesikli kutuyla işaretlenir; işaretler çıktıya girmez.
- **Telefon:** dar ekranda araç çubuğu kısalır (tema, yardım, yinele ve konum sıfırlama *Dosya* menüsüne taşınır); görünüşler parmakla sürüklenir.

## Özel takım, çift dilli resim ve katalog

- **Özel takım (serbest profil):** takım tipi *Özel Takım*; sap ucundan (x = 0) uca doğru noktalar (`x`, `⌀`) girilir, aralarında doğru çizilir. Aynı x'e iki nokta dikey basamak, son noktada ⌀ 0 sivri uç olur. D, d ve L noktalardan hesaplanır; yatay parçaların boyu ve çapı, eğimli parçaların eksenle açısı otomatik ölçülür. Kanallı bölümün başı otomatik (en büyük çapa ulaşılan yer) ya da elle verilir. Sap detayı (DIN 6535) bu tipte yoktur.
- **Resim dili:** *Resim → Resim dili* Türkçe / English. Antet etiketleri, tablo başlıkları, görünüş başlıkları, damga ve diş profili yazıları çevrilir; kullanıcı metinleri (alet adı, notlar, malzeme, iş emrinden gelen özellik adları) ve firma adı çevrilmez. Arayüz Türkçe kalır.
- **Katalog sayfası** (*Veri → Katalog sayfası…*): kütüphanedeki (ve isterseniz geçerli) takımlardan A4 katalog sayfaları; her hücrede küçük yan görünüş, ad, ⌀×L, diş/helis, malzeme/kaplama ve çizim no. Başlık, sütun sayısı (2–4) ve dil seçilir; PDF, PNG, SVG, çok sayfalıysa tüm sayfalar PDF olarak indirilir.

## Firma ayarları, onay akışı, ÜTS köprüsü, kurulum, ortak klasör

- **Firma ayarları** (*Dosya → Firma ayarları…*): firma adı, varsayılan çizen, telefon, e-posta, web ve **logo** (PNG/JPG/SVG). Antette ve katalogda kullanılır; bu tarayıcıda saklanır. Varsayılan MİHENK bilgileri kodda kalır, "Varsayılana dön" ile geri gelir.
- **Onay ve revizyon** (*Belge sekmesi*): Taslak → **Onayla** (onaylayan adı gerekir) → ONAYLANDI → **Yeni revizyon** (neyin değiştiği yazılır; harf A, B… ilerler, onay sıfırlanır) → REVİZYON → yeniden onay. Her adım geçmişe yazılır ve sayfanın sağ üstünde **revizyon tablosu** olur (en yeni 4 satır). Onay damgası artık sol üst köşede ve sürüklenebilir.
- **ÜTS köprüsü:** `…/#ie=<base64url(iş emri yazısı)>` bağlantısı iş emri penceresini okunan değerlerle açar; kullanıcı onaylamadan çizilmez, veri sunucuya gitmez. Bu depo **ÜTS'ye dokunmaz**: ÜTS tarafındaki düğme için `docs/UTS-ENTEGRASYON.md`; denemek için `node scripts/ie-baglantisi.mjs is-emri.txt`.
- **Kurulabilir uygulama (PWA):** yayın adresinde (https) tarayıcı "Uygulamayı yükle" önerir; internetsiz de açılır (ağ önce, önbellek yedek). Dosyadan (`file://`) açılışta servis işçisi kapalıdır. İkonlar `node scripts/ikon-uret.mjs` ile üretilir.
- **Ortak klasör** (*Kütüphane → Ortak klasör*, Chrome/Edge): ağ sürücüsü, OneDrive ya da Dropbox klasörünü bağlayın; takımlar `.mhk.json` dosyaları olarak orada durur, klasöre erişen herkes aynı kütüphaneyi görür. Aynı adlı dosyanın üzerine yazarken sorar. Sunucu gerekmez; çakışan eşzamanlı düzenlemeleri birleştirmez (son yazan kazanır).
