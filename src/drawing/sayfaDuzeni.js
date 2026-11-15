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

// İş emri çiziminde teknik veri tablosunun yerine konan üretim özellikleri tablosu
export const URETIM = { baslikH: 6, satirMin: 3.9, satirAzami: 4.6, sutunW: 54 };

/**
 * n özellik, antet yüksekliğindeki şeride kaç sütunla sığar? Satır yüksekliği
 * 3,9 mm'nin altına inmez; sığmayan fazlalık atılır (en çok 3 sütun).
 * @returns {null | {sutun:number, satir:number, satirH:number, w:number, adet:number}}
 */
export function uretimSutunlari(n, h = 52) {
  if (!(n > 0)) return null;
  const mesaj = h - URETIM.baslikH - 1;
  const azami = Math.max(1, Math.floor(mesaj / URETIM.satirMin));
  const sutun = Math.min(3, Math.ceil(n / azami));
  const adet = Math.min(n, sutun * azami);
  const satir = Math.ceil(adet / sutun);
  return { sutun, satir, satirH: Math.min(URETIM.satirAzami, mesaj / satir), w: sutun * URETIM.sutunW, adet };
}

const CERCEVE ={ sol: 20, ust: 10, sag: 10, alt: 10 }; // ISO 5457
export const ANTET = { w: 200, h: 52 };                  // müşteri çizimi: ISO 7200 önerisi en çok 180 mm; logo bölümü geniş olsun diye 200 mm
export const ANTET_IE = { w: 140, h: 52 };               // iş emri çizimi: dar antet (solunda üretim özellikleri tablosu)

/**
 * @param {object} o
 * @param {"A4"|"A3"} o.kagit
 * @param {number} o.L       takım boyu (mm)
 * @param {number} o.D       en büyük çap (mm)
 * @param {number} [o.kademeSayisi]  üstte ek ölçü satırı için
 * @param {string} [o.olcek]  "otomatik" ya da "2:1" gibi
 * @param {"musteri"|"ie"} [o.tur]  çizim türü: müşteri çizimi (geniş antet + teknik veri) ya da iş emri çizimi (dar antet + üretim özellikleri)
 * @param {number} [o.uretimSayisi]  iş emri çiziminde şeritte gösterilecek üretim özelliği sayısı
 */
export function sayfaDuzeni({ kagit = "A4", L, D, kademeSayisi = 0, olcek = "otomatik", tur = "musteri", uretimSayisi = 0 }) {
  const k = KAGITLAR[kagit] || KAGITLAR.A4;
  const ie = tur === "ie";
  const cerceve = { x: CERCEVE.sol, y: CERCEVE.ust, w: k.w - CERCEVE.sol - CERCEVE.sag, h: k.h - CERCEVE.ust - CERCEVE.alt };
  const aw = ie ? ANTET_IE.w : ANTET.w;
  const antet = { x: cerceve.x + cerceve.w - aw, y: cerceve.y + cerceve.h - ANTET.h, w: aw, h: ANTET.h };
  // Müşteri çiziminde teknik veri tablosu antetin soluna kadar uzanır. İş emri çiziminde teknik veri yoktur:
  // o yere (antete bitişik) üretim özellikleri tablosu gelir; özellik yoksa şerit yalnız antettir.
  const uretim = ie ? uretimSutunlari(uretimSayisi, ANTET.h) : null;
  const veriW = ie ? (uretim ? uretim.w : 0) : antet.x - cerceve.x;
  const veriTablosu = { x: antet.x - veriW, y: antet.y, w: veriW, h: ANTET.h };
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
  return { kagit: { ad: KAGITLAR[kagit] ? kagit : "A4", ...k }, tur: ie ? "ie" : "musteri", uretim, cerceve, antet, veriTablosu, alan, yan, uc };
}
