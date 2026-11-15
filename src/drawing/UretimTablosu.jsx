import { CIZGI, YAZI } from "./iso";
import { sigdir } from "./Antet";
import { URETIM } from "./sayfaDuzeni";

/** Üretim özelliği tablosu gösterilecek mi? Yalnız iş emri çiziminde (müşteri çiziminde üretim verisi yok). */
export function uretimVarMi(params) {
  return params.cizimTuru === "ie" && Array.isArray(params.ekOzellikler) && params.ekOzellikler.length > 0 && params.ekGoster !== false;
}

/**
 * İş emri çiziminde, antetin soluna (teknik veri tablosunun yerine) konan üretim özellikleri tablosu.
 * Yeri ve sütun sayısı sayfa düzeninden gelir (sayfa.veriTablosu, sayfa.uretim).
 */
export function UretimTablosu({ params, sayfa }) {
  const yr = sayfa.uretim;
  if (!uretimVarMi(params) || !yr) return null;
  const { x, y, w, h } = sayfa.veriTablosu;
  const { sutun, satir, satirH } = yr;
  const cw = w / sutun;
  const oge = params.ekOzellikler.slice(0, yr.adet);
  return (
    <g id="uretim-tablosu" fontFamily={YAZI.font}>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />
      <rect x={x} y={y} width={w} height={URETIM.baslikH} fill="#eef1f5" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <text x={x + 2} y={y + URETIM.baslikH - 1.9} fontSize={3.4} fontWeight={700} letterSpacing="0.5" fill="#000">ÜRETİM ÖZELLİKLERİ</text>
      {Array.from({ length: sutun - 1 }, (_, i) => (
        <line key={i} x1={x + (i + 1) * cw} y1={y + URETIM.baslikH} x2={x + (i + 1) * cw} y2={y + h} stroke="#000" strokeWidth={CIZGI.ince} />
      ))}
      {oge.map(([ad, deger], i) => {
        const c = Math.floor(i / satir), r = i % satir;          // sütun sütun dolar
        const cx = x + c * cw, cy = y + URETIM.baslikH + r * satirH;
        const azami = Math.floor((cw * 0.56) / (2.7 * 0.46));
        const etiket = ad.length > azami ? `${ad.slice(0, azami - 1)}…` : ad;
        return (
          <g key={i}>
            {r > 0 && <line x1={cx} y1={cy} x2={cx + cw} y2={cy} stroke="#9aa3ae" strokeWidth={0.2} />}
            <text x={cx + 1.6} y={cy + satirH * 0.72} fontSize={2.7} fill="#444">{etiket}</text>
            <text x={cx + cw - 1.4} y={cy + satirH * 0.72} fontSize={sigdir(deger, cw * 0.38, 3, 2.4)} fontWeight={700} textAnchor="end" fill="#000">{deger}</text>
          </g>
        );
      })}
    </g>
  );
}
