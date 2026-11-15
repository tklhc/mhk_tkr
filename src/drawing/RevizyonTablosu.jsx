import { CIZGI, YAZI } from "./iso";
import { sigdir, tarihYaz } from "./Antet";
import { mt } from "./metinler";

const BASLIK_H = 5, SATIR_H = 4.4, EN_COK = 4;
const SUTUNLAR = [["rev", 11], ["tarih", 20], ["aciklama", 49], ["kisi", 28]];      // mm (toplam 108)

/** Sayfada gösterilecek revizyon satırları: en yeni üstte, en çok 4. */
export function revizyonSatirlari(params) {
  const l = Array.isArray(params.revizyonlar) ? params.revizyonlar : [];
  return l.slice(-EN_COK).reverse();
}

/** Revizyon tablosunun kutusu (kâğıt mm): çerçevenin sağ üst köşesi. Satır yoksa null. */
export function revizyonKutusu(params, sayfa) {
  const s = revizyonSatirlari(params);
  if (!s.length) return null;
  const w = SUTUNLAR.reduce((t, [, c]) => t + c, 0), h = BASLIK_H + s.length * SATIR_H;
  const c = sayfa.cerceve;
  return { x: c.x + c.w - w - 1, y: c.y + 1, w, h, satirlar: s };
}

/** Revizyon tablosu (ISO 7200 geleneği: sağ üst köşe). Yalnız geçmişi olan resimlerde çizilir. */
export function RevizyonTablosu({ params, sayfa }) {
  const k = revizyonKutusu(params, sayfa);
  if (!k) return null;
  let x = k.x;
  return (
    <g id="revizyon-tablosu" fontFamily={YAZI.font}>
      <rect x={k.x} y={k.y} width={k.w} height={k.h} fill="#fff" stroke={CIZGI.renk} strokeWidth={0.5} />
      <rect x={k.x} y={k.y} width={k.w} height={BASLIK_H} fill="#eef1f5" stroke={CIZGI.renk} strokeWidth={0.25} />
      {SUTUNLAR.map(([ad, cw], i) => {
        const cx = x; x += cw;
        return (
          <g key={ad}>
            {i > 0 && <line x1={cx} y1={k.y} x2={cx} y2={k.y + k.h} stroke="#9aa3ae" strokeWidth={0.2} />}
            <text x={cx + 1.4} y={k.y + BASLIK_H - 1.5} fontSize={2.6} fontWeight={700} fill="#000">{mt(params, `rev_${ad}`)}</text>
            {k.satirlar.map((s, r) => {
              const deger = ad === "tarih" ? tarihYaz(s.tarih) : s[ad];
              const yy = k.y + BASLIK_H + r * SATIR_H;
              return (
                <g key={r}>
                  {i === 0 && <line x1={k.x} y1={yy} x2={k.x + k.w} y2={yy} stroke="#9aa3ae" strokeWidth={0.2} />}
                  <text x={cx + 1.4} y={yy + SATIR_H - 1.2} fontSize={sigdir(deger, cw - 2.4, 2.9, 2.4)} fill="#000" fontWeight={ad === "rev" ? 700 : 400}>{deger}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
