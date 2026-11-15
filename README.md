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
