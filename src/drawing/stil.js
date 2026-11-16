// Sunum stili: kaplama rengi ve silindirik gölgelendirme yardımcıları.
// Yalnız görünüm içindir; ölçüler ve kontur geometriden gelir (teknik stilde hiç kullanılmaz).

/** #rrggbb rengini amt kadar açar (+) ya da koyulaştırır (−). */
export function ton(hex, amt) {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#888888";
  const c = (i) => Math.min(255, Math.max(0, parseInt(h.slice(i, i + 2), 16) + amt));
  return `#${[1, 3, 5].map((i) => c(i).toString(16).padStart(2, "0")).join("")}`;
}

// Sıra önemli: "AlTiN" ve "ALTIN" (altın rengi) ayrı, "TiN"den önce kontrol edilir.
// Türkçe küçük harfe çevrilince ALTIN → "altın" (ı), AlTiN → "altin" (i) olur.
const KAPLAMALAR = [
  [/altın|gold/, "#c9a032"],                 // altın rengi
  [/altin|alcrn|alcr/, "#4d4852"],           // AlTiN / AlCrN: koyu antrasit
  [/tialn|tisin/, "#6d5f80"],                // TiAlN: mor-gri
  [/ticn/, "#6b7c93"],                       // TiCN: mavi-gri
  [/\btin\b/, "#d2ab3a"],                    // TiN: altın sarısı
  [/dlc|karbon|carbon/, "#383a3f"],          // DLC: siyah
  [/crn/, "#b9bec6"],                        // CrN: gümüş
  [/kaplamasız|kaplamasiz|none|yok|^-*$/, "#a9b3bf"], // çıplak karbür
];

/** Kaplama adından kesici bölüm rengi; tanınmazsa varsayılan (colCut). */
export function kaplamaRengi(kaplama, varsayilan = "#6088b0") {
  const ad = String(kaplama ?? "").trim().toLocaleLowerCase("tr");
  for (const [re, renk] of KAPLAMALAR) if (re.test(ad)) return renk;
  return varsayilan;
}

/** Silindir gölgesi için dikey gradyan duraklar (üstten alta). */
export function silindirDuraklari(renk) {
  return [
    [0, ton(renk, -48)], [14, ton(renk, -12)], [34, ton(renk, 58)],
    [52, ton(renk, 26)], [80, ton(renk, -26)], [100, ton(renk, -58)],
  ];
}
