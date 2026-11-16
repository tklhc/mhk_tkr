// Tolerans yazımını çözer ve ISO 286-1 tablolarından sayısal sapmaları hesaplar.
//
// Desteklenen yazımlar:
//   ISO uyum:   "h6", "H7", "js6", "e8", "m7", "G6" …  (mil: d e f g h js k m n p; delik: D E F G H JS)
//   Simetrik:   "±0.05", "±0,05", "+-0.05"
//   Sapma:      "+0.02/-0.01", "0/-0.009", "-0.01/-0.03", "+0.1 0"
// Sonuç mm cinsindendir.

// Anma ölçüsü aralıkları (üst sınır dahil, mm)
const ARALIK = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];

// IT1…IT16 temel tolerans değerleri, µm (ISO 286-1 Tablo 1)
const IT = [
  [0.8, 1.2, 2, 3, 4, 6, 10, 14, 25, 40, 60, 100, 140, 250, 400, 600],
  [1, 1.5, 2.5, 4, 5, 8, 12, 18, 30, 48, 75, 120, 180, 300, 480, 750],
  [1, 1.5, 2.5, 4, 6, 9, 15, 22, 36, 58, 90, 150, 220, 360, 580, 900],
  [1.2, 2, 3, 5, 8, 11, 18, 27, 43, 70, 110, 180, 270, 430, 700, 1100],
  [1.5, 2.5, 4, 6, 9, 13, 21, 33, 52, 84, 130, 210, 330, 520, 840, 1300],
  [1.5, 2.5, 4, 7, 11, 16, 25, 39, 62, 100, 160, 250, 390, 620, 1000, 1600],
  [2, 3, 5, 8, 13, 19, 30, 46, 74, 120, 190, 300, 460, 740, 1200, 1900],
  [2.5, 4, 6, 10, 15, 22, 35, 54, 87, 140, 220, 350, 540, 870, 1400, 2200],
  [3.5, 5, 8, 12, 18, 25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500],
  [4.5, 7, 10, 14, 20, 29, 46, 72, 115, 185, 290, 460, 720, 1150, 1850, 2900],
  [6, 8, 12, 16, 23, 32, 52, 81, 130, 210, 320, 520, 810, 1300, 2100, 3200],
  [7, 9, 13, 18, 25, 36, 57, 89, 140, 230, 360, 570, 890, 1400, 2300, 3600],
  [8, 10, 15, 20, 27, 40, 63, 97, 155, 250, 400, 630, 970, 1550, 2500, 4000],
];

// Millerin temel sapmaları, µm. d–g: üst sapma es (negatif); k–p: alt sapma ei (pozitif)
const MIL_ES = {
  d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
  e: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],
  f: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],
  g: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20],
  h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const MIL_EI = {
  k: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5], // yalnız IT4–IT7; diğer kalitelerde 0
  m: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
  n: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40],
  p: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68],
};

function aralikIndeksi(anma) {
  if (!(anma > 0) || anma > 500) return -1;
  return ARALIK.findIndex((ust) => anma <= ust);
}

/** IT kalitesinin değeri (µm) ya da null. */
export function itDegeri(anma, kalite) {
  const i = aralikIndeksi(anma);
  if (i < 0 || !(kalite >= 1 && kalite <= 16)) return null;
  return IT[i][kalite - 1];
}

// js/JS: ±IT/2; IT7–IT11'de IT tek sayıysa bir alt çift sayıya yuvarlanır
function jsYarisi(it, kalite) {
  if (kalite >= 7 && kalite <= 11 && it % 2 === 1) return (it - 1) / 2;
  return it / 2;
}

const yuvarla = (v) => Math.round(v * 1e6) / 1e6;

/**
 * ISO uyum sınıfından sapmalar.
 * @returns {{ ust: number, alt: number } | null} mm
 */
export function isoSapma(anma, sinif) {
  const m = /^(js|JS|[a-zA-Z])(\d{1,2})$/.exec(String(sinif).trim());
  if (!m) return null;
  const harf = m[1], kalite = +m[2];
  const i = aralikIndeksi(anma);
  const it = itDegeri(anma, kalite);
  if (i < 0 || it == null) return null;
  const delik = harf === harf.toUpperCase();
  const h = harf.toLowerCase();
  let es, ei; // mil cinsinden µm

  if (h === "js") {
    const y = jsYarisi(it, kalite);
    return { ust: yuvarla(y / 1000), alt: yuvarla(-y / 1000) };
  }
  if (MIL_ES[h]) {
    es = MIL_ES[h][i];
    ei = es - it;
  } else if (MIL_EI[h] && !delik) {
    ei = h === "k" && !(kalite >= 4 && kalite <= 7) ? 0 : MIL_EI[h][i];
    es = ei + it;
  } else {
    return null; // K, M, N, P delikleri (Δ düzeltmesi gerekir) desteklenmiyor
  }
  if (delik) [es, ei] = [-ei, -es]; // D–H delikleri milin aynası: EI = -es
  return { ust: yuvarla(es / 1000), alt: yuvarla(ei / 1000) };
}

const sayiOku = (s) => {
  const v = parseFloat(String(s).replace(",", ".").replace("−", "-"));
  return Number.isFinite(v) ? v : null;
};

/**
 * Tolerans metnini çözer.
 * @param {string} metin  Kullanıcının yazdığı tolerans
 * @param {number} anma   Anma ölçüsü (ISO sınıfları için gerekli)
 * @returns {null | { tur: "iso"|"simetrik"|"sapma", sinif?: string, ust: number|null, alt: number|null }}
 *   ISO sınıfı tanınıp tabloda bulunamazsa ust/alt null döner (metin yine gösterilir).
 */
export function toleransCoz(metin, anma) {
  const t = String(metin ?? "").trim().replace(/\s+/g, " ");
  if (!t) return null;

  if (/^(js|JS|[a-zA-Z])\d{1,2}$/.test(t)) {
    const s = isoSapma(anma, t);
    return { tur: "iso", sinif: t, ust: s ? s.ust : null, alt: s ? s.alt : null };
  }
  const sim = /^(?:±|\+-|\+\/-)\s*([\d.,]+)$/.exec(t);
  if (sim) {
    const v = sayiOku(sim[1]);
    if (v != null) return { tur: "simetrik", ust: v, alt: -v };
  }
  const iki = /^([+\-−]?\s*[\d.,]+)\s*(?:\/|\s)\s*([+\-−]?\s*[\d.,]+)$/.exec(t);
  if (iki) {
    const a = sayiOku(iki[1].replace(/\s/g, "")), b = sayiOku(iki[2].replace(/\s/g, ""));
    if (a != null && b != null) return { tur: "sapma", ust: Math.max(a, b), alt: Math.min(a, b) };
  }
  return null;
}

/** Sapmayı resimde yazılacak biçime çevirir: +0,02 / -0,009 / 0 */
export function sapmaYaz(v) {
  if (v == null) return "";
  if (Math.abs(v) < 1e-9) return "0";
  const s = (Math.abs(v)).toFixed(4).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
  return (v > 0 ? "+" : "−") + s;
}
