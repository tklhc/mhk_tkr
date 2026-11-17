// Yazı çakışması denetimi: ölçü, açı, kılavuz ve not yazılarının sınır kutuları birbirini örtüyor mu?
// Çizimde (ekranda) ölçülür; kağıt (mm) koordinatındaki kutular saf işlevle karşılaştırılır.
// Antet, tablolar ve çerçeve (sabit yerleşim) ile aynı ölçü yazısının parçaları (ana yazı + sapmalar) denetlenmez.

/**
 * @typedef {{ id: number, x: number, y: number, w: number, h: number, grup: unknown, metin: string }} Kutu
 */

/** İki kutunun kesişimi (pay mm kadar küçültülerek: yalnız değen yazılar çakışma sayılmaz). Yoksa null. */
export function kesisim(a, b, pay = 0.2) {
  const x1 = Math.max(a.x + pay, b.x + pay), y1 = Math.max(a.y + pay, b.y + pay);
  const x2 = Math.min(a.x + a.w - pay, b.x + b.w - pay), y2 = Math.min(a.y + a.h - pay, b.y + b.h - pay);
  return x2 > x1 && y2 > y1 ? { x: x1 - pay, y: y1 - pay, w: x2 - x1 + 2 * pay, h: y2 - y1 + 2 * pay } : null;
}

/**
 * Çakışan yazı çiftleri. Aynı gruptaki (ör. bir ölçünün ana yazısı ve sapmaları) kutular atlanır.
 * @param {Kutu[]} kutular
 * @returns {Array<{ a: Kutu, b: Kutu, alan: {x:number,y:number,w:number,h:number} }>}
 */
export function cakismaBul(kutular, pay = 0.2) {
  const sonuc = [];
  for (let i = 0; i < kutular.length; i++) {
    for (let j = i + 1; j < kutular.length; j++) {
      const a = kutular[i], b = kutular[j];
      if (a.grup === b.grup) continue;
      const alan = kesisim(a, b, pay);
      if (alan) sonuc.push({ a, b, alan });
    }
  }
  return sonuc;
}

/** Denetlenmeyecek bölgeler (kimliğine göre): sabit yerleşimli antet, tablolar, çerçeve. */
export const YOK_SAYILAN = ["antet", "cerceve", "uretim-tablosu", "teknik-veri", "revizyon-tablosu"];

/** Çizimdeki bütün yazıların kâğıt koordinatındaki kutuları (tarayıcıda). */
export function kutulariTopla(svg) {
  const kok = svg.getScreenCTM();
  if (!kok) return [];
  const ters = kok.inverse();
  const kutular = [];
  let id = 0;
  for (const t of svg.querySelectorAll("text")) {
    if (t.closest(YOK_SAYILAN.map((k) => `#${k}`).join(","))) continue;
    const metin = (t.textContent || "").trim();
    const ctm = t.getScreenCTM();
    if (!metin || !ctm) continue;
    let b;
    try { b = t.getBBox(); } catch { continue; }
    if (!(b.width > 0) || !(b.height > 0)) continue;
    const m = ters.multiply(ctm);
    const xs = [], ys = [];
    for (const [px, py] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]) {
      const q = new DOMPoint(px, py).matrixTransform(m);
      xs.push(q.x); ys.push(q.y);
    }
    kutular.push({ id: id++, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), grup: t.parentNode, metin });
  }
  return kutular;
}
