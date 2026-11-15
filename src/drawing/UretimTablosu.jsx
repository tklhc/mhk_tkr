import { takimProfili } from "../geometry/profil";
import { CIZGI, YAZI } from "./iso";
import { sigdir } from "./Antet";

const SATIR_H = 4.6, BASLIK_H = 6;

/** Üretim özelliği tablosu gösterilecek mi? Yalnız iş emri çiziminde (müşteri çiziminde üretim verisi yok). */
export function uretimVarMi(params) {
  return params.cizimTuru === "ie" && Array.isArray(params.ekOzellikler) && params.ekOzellikler.length > 0 && params.ekGoster !== false;
}

/**
 * Tablonun yerleşimi: yan görünüş bölgesinin sol alt köşesi, ölçü satırlarının altı.
 * Önce 2, sığmazsa 3 sütun dener; hiçbiri sığmazsa null döner.
 */
export function uretimYerlesimi(params, yan) {
  if (!uretimVarMi(params)) return null;
  const g = takimProfili(params);
  const hmax = Math.max(g.D, g.d, 1) / 2;
  const { bolge, olcek: s, oy } = yan;
  const ustSinir = oy + hmax * s + 24;        // ölçü satırlarının altı
  const altSinir = bolge.y + bolge.h - 3;
  const n = params.ekOzellikler.length;
  for (const sutun of [2, 3]) {
    const satir = Math.ceil(n / sutun);
    const h = BASLIK_H + satir * SATIR_H + 1;
    const w = Math.min(sutun * 58, bolge.w - 6);
    if (altSinir - h >= ustSinir && w / sutun >= 40) return { sutun, satir, h, w, x: bolge.x + 3, y: altSinir - h };
  }
  return null;
}

/** İş emrinden gelen çizilmeyen üretim özellikleri (taşlama verileri) tablosu. */
export function UretimTablosu({ params, yan }) {
  const yr = uretimYerlesimi(params, yan);
  if (!yr) return null;
  const { sutun, satir, h, w, x, y } = yr;
  const cw = w / sutun;
  const oge = params.ekOzellikler;
  return (
    <g id="uretim-tablosu" fontFamily={YAZI.font}>
      <rect x={x} y={y} width={w} height={h} fill="#fff" stroke={CIZGI.renk} strokeWidth={0.5} />
      <rect x={x} y={y} width={w} height={BASLIK_H} fill="#eef1f5" stroke={CIZGI.renk} strokeWidth={0.25} />
      <text x={x + 2} y={y + BASLIK_H - 1.8} fontSize={3.2} fontWeight={700} letterSpacing="0.5" fill="#000">ÜRETİM ÖZELLİKLERİ</text>
      {Array.from({ length: sutun - 1 }, (_, i) => (
        <line key={i} x1={x + (i + 1) * cw} y1={y + BASLIK_H} x2={x + (i + 1) * cw} y2={y + h} stroke="#9aa3ae" strokeWidth={0.2} />
      ))}
      {oge.map(([ad, deger], i) => {
        const c = Math.floor(i / satir), r = i % satir;          // sütun sütun dolar
        const cx = x + c * cw, cy = y + BASLIK_H + r * SATIR_H;
        const etiketW = cw * 0.55;
        const azami = Math.floor(etiketW / (2.7 * 0.46));
        const etiket = ad.length > azami ? `${ad.slice(0, azami - 1)}…` : ad;
        return (
          <g key={i}>
            {r > 0 && <line x1={cx} y1={cy} x2={cx + cw} y2={cy} stroke="#c8ced6" strokeWidth={0.15} />}
            <text x={cx + 1.6} y={cy + SATIR_H - 1.3} fontSize={2.7} fill="#444">{etiket}</text>
            <text x={cx + cw - 1.4} y={cy + SATIR_H - 1.3} fontSize={sigdir(deger, cw * 0.4, 3, 2.4)} fontWeight={700} textAnchor="end" fill="#000">{deger}</text>
          </g>
        );
      })}
    </g>
  );
}
