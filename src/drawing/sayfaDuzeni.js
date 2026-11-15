// Resim sayfasının düzeni: kağıt, çerçeve, antet, görünüş bölgeleri ve ölçek.
// Tüm değerler kağıt üzerinde mm'dir; SVG viewBox da mm olduğu için
// yazdırıldığında ölçek gerçektir (1:1 yazan resimde 10 mm cetvelle 10 mm ölçülür).

export const KAGITLAR = {
  A4: { w: 297, h: 210 },
  A3: { w: 420, h: 297 },
};

// ISO 5455 standart ölçekleri (büyütme katsayısı)
export const OLCEKLER = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1];

/** 2 → "2:1", 0.5 → "1:2" */
export function olcekYaz(s) {
  if (!(s > 0)) return "-";
  return s >= 1 ? `${+s.toFixed(3)}:1` : `1:${+(1 / s).toFixed(3)}`;
}

/** "2:1" → 2, "1:5" → 0.2; tanınmazsa null */
export function olcekOku(metin) {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)\s*$/.exec(String(metin ?? ""));
  if (!m) return null;
  const a = parseFloat(m[1].replace(",", ".")), b = parseFloat(m[2].replace(",", "."));
  return a > 0 && b > 0 ? a / b : null;
}

/** Standart seriden, verilen boyutların sığdığı en büyük ölçek. */
export function olcekSec(sigdirmalar) {
  for (const s of OLCEKLER) {
    if (sigdirmalar.every(([olcu, yer]) => olcu * s <= yer)) return s;
  }
  return OLCEKLER[OLCEKLER.length - 1];
}

const CERCEVE = { sol: 20, ust: 10, sag: 10, alt: 10 }; // ISO 5457
export const ANTET = { w: 200, h: 52 };                  // ISO 7200 önerisi en çok 180 mm; logo bölümü geniş olsun diye 200 mm

/**
 * @param {object} o
 * @param {"A4"|"A3"} o.kagit
 * @param {number} o.L       takım boyu (mm)
 * @param {number} o.D       en büyük çap (mm)
 * @param {number} [o.kademeSayisi]  üstte ek ölçü satırı için
 * @param {string} [o.olcek]  "otomatik" ya da "2:1" gibi
 */
export function sayfaDuzeni({ kagit = "A4", L, D, kademeSayisi = 0, olcek = "otomatik" }) {
  const k = KAGITLAR[kagit] || KAGITLAR.A4;
  const cerceve = { x: CERCEVE.sol, y: CERCEVE.ust, w: k.w - CERCEVE.sol - CERCEVE.sag, h: k.h - CERCEVE.ust - CERCEVE.alt };
  const antet = { x: cerceve.x + cerceve.w - ANTET.w, y: cerceve.y + cerceve.h - ANTET.h, w: ANTET.w, h: ANTET.h };
  const veriTablosu = { x: cerceve.x, y: antet.y, w: antet.x - cerceve.x, h: ANTET.h };
  const alan = { x: cerceve.x, y: cerceve.y, w: cerceve.w, h: antet.y - cerceve.y };

  // Uç görünüş sağda, yan görünüş solda
  const ucW = Math.min(Math.max(alan.w * 0.26, 64), 120);
  const ucBolge = { x: alan.x + alan.w - ucW, y: alan.y, w: ucW, h: alan.h };
  const yanBolge = { x: alan.x, y: alan.y, w: alan.w - ucW, h: alan.h };

  // Ölçü çizgileri için pay: solda d, sağda D; altta L ve l1, üstte l2/kademeler
  const yatayPay = 36;
  const ustPay = 16 + kademeSayisi * 7;
  const altPay = 30;
  const secilen = olcekOku(olcek);
  const yanOlcek = secilen || olcekSec([[L, yanBolge.w - yatayPay], [D, yanBolge.h - ustPay - altPay]]);
  const ucOlcek = olcekSec([[D, Math.min(ucBolge.w - 30, ucBolge.h - 46)]]);

  const yanBoy = L * yanOlcek;
  const yan = {
    bolge: yanBolge,
    olcek: yanOlcek,
    ox: yanBolge.x + (yanBolge.w - yanBoy) / 2,                 // sap ucunun x'i
    oy: yanBolge.y + ustPay + (yanBolge.h - ustPay - altPay) / 2, // eksen
    tasiyor: yanBoy > yanBolge.w - 10 || D * yanOlcek > yanBolge.h - 10,
  };
  const uc = {
    bolge: ucBolge,
    olcek: ucOlcek,
    cx: ucBolge.x + ucBolge.w / 2,
    cy: yan.oy,
  };
  return { kagit: { ad: KAGITLAR[kagit] ? kagit : "A4", ...k }, cerceve, antet, veriTablosu, alan, yan, uc };
}
