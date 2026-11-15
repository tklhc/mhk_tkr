# MİHENK Teknik Resim

Kesici takımlar (freze, matkap, kademeli matkap…) için parametrik teknik resim uygulaması.
Parametrelerden yan görünüş, uç görünüş, antet, DXF, PDF/SVG/PNG ve Excel rapor üretir.

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
| `src/drawing/` | SVG çizim bileşenleri: yan görünüş, uç görünüş, antet, ölçü yardımcıları |
| `src/ui/` | Parametre paneli, takım kütüphanesi, girdi bileşenleri |
| `src/io/` | DXF, CSV içe aktarma, Excel çıktı |
| `src/view3d/` | 3D önizleme (Three.js) |
| `src/assets/` | Logo, filigran, uç görünüş görselleri |
| `tests/` | Geometri ve DXF testleri |

Yeni bir takım tipi önce `profil.js`'e eklenir; yan görünüş, DXF ve 3D ölçüleri oradan alır.

## Yayın

`main`'e her push'ta GitHub Actions lint + test + derleme yapar ve `dist/`'i GitHub Pages'e yayınlar
(`.github/workflows/yayin.yml`). Diğer dallarda ve PR'larda yalnız kontrol çalışır.
