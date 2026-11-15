import { takimProfili } from "../geometry/profil";
import { CIZGI, YAZI, Ok } from "./iso";
import { Surukle } from "./Draggable";

const n = (v) => +v.toFixed(3);
const metin = (v) => String(v ?? "").trim();

/** Salgı (kesici kenar, sap A datumuna göre) girilmiş mi? */
export function tolSembolVar(params) {
  return !!metin(params.salgi);
}

/** Salgı çerçevesi için takımın üstünde ayrılacak ek boşluk (mm). */
export const SALGI_UST_EK = 12;

/**
 * Salgı işareti (yan görünüşte, sürüklenebilir): kesici kısma ↗ 0,01 | A çerçevesi, sapın üstünde A datumu.
 * Değer kullanıcının girdiği metindir; program standart tabloya göre değer önermez.
 */
export function ToleransSembolleri({ params, yerlesim, dimOff, setDimOff }) {
  const g = takimProfili(params);
  if (!tolSembolVar(params) || !(g.D > 0) || !(g.d > 0) || !(g.L > 0)) return null;
  const { olcek: s, ox, oy } = yerlesim;
  const X = (x) => ox + x * s;
  const Y = (r) => oy - r * s;
  const hmax = Math.max(g.D, g.d) / 2, hd = g.d / 2, hD = g.D / 2;
  const ust = Y(hmax);
  const salgi = metin(params.salgi);
  const e = [];
  const cizgi = { stroke: CIZGI.renk, strokeWidth: CIZGI.ince, fill: "none" };
  const yazi = { fontFamily: YAZI.font, fill: CIZGI.renk };
  const sapOrta = X(g.x.sapSonu * 0.5);

  // ── Salgı: A datumu + tolerans çerçevesi ──
  if (salgi) {
    // A datumu: sap üstünde taban çizgisi üzerinde üçgen, çizgiyle kutuya bağlı
    const dy = Y(hd), kutuY = ust - 17.5, kb = 5;
    e.push(
      <g key="datum">
        <path d={`M ${n(sapOrta - 2)} ${n(dy)} L ${n(sapOrta + 2)} ${n(dy)} L ${n(sapOrta)} ${n(dy - 3.5)} Z`} fill={CIZGI.renk} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
        <line x1={n(sapOrta)} y1={n(dy - 3.5)} x2={n(sapOrta)} y2={n(kutuY + kb)} {...cizgi} />
        <rect x={n(sapOrta - kb / 2)} y={n(kutuY)} width={kb} height={kb} {...cizgi} strokeWidth={CIZGI.kalin * 0.7} />
        <text x={n(sapOrta)} y={n(kutuY + kb - 1.3)} textAnchor="middle" fontSize={3.5} fontWeight={700} {...yazi}>A</text>
      </g>
    );
    // Çerçeve: [↗][değer][A], kesici kısmın ortasının üstünde; ok kesici kenarın üst çizgisine iner
    const xc = g.tip === "stepdrill" ? X((g.x.boyunSonu + g.L) / 2) : X(g.x.boyunSonu + 0.6 * (g.L - g.x.boyunSonu));
    const hucre = 5, deger = Math.max(8, salgi.length * 2 + 4), fy = ust - 24, fh = 5;
    const fx = xc - (hucre + deger + hucre) / 2;
    e.push(
      <g key="salgi">
        <rect x={n(fx)} y={n(fy)} width={hucre + deger + hucre} height={fh} {...cizgi} strokeWidth={CIZGI.kalin * 0.7} />
        <line x1={n(fx + hucre)} y1={n(fy)} x2={n(fx + hucre)} y2={n(fy + fh)} {...cizgi} />
        <line x1={n(fx + hucre + deger)} y1={n(fy)} x2={n(fx + hucre + deger)} y2={n(fy + fh)} {...cizgi} />
        {/* Dairesel salgı simgesi: 45° ok */}
        <path d={`M ${n(fx + 1.2)} ${n(fy + fh - 1)} L ${n(fx + hucre - 1.4)} ${n(fy + 1.4)}`} {...cizgi} strokeWidth={0.3} />
        <path d={`M ${n(fx + hucre - 1.4)} ${n(fy + 1.4)} L ${n(fx + hucre - 3.2)} ${n(fy + 1.6)} L ${n(fx + hucre - 1.2)} ${n(fy + 3.4)} Z`} fill={CIZGI.renk} stroke="none" />
        <text x={n(fx + hucre + deger / 2)} y={n(fy + fh - 1.3)} textAnchor="middle" fontSize={3.4} {...yazi}>{salgi}</text>
        <text x={n(fx + hucre + deger + hucre / 2)} y={n(fy + fh - 1.3)} textAnchor="middle" fontSize={3.4} {...yazi}>A</text>
        <line x1={n(xc)} y1={n(fy + fh)} x2={n(xc)} y2={n(Y(hD) - 0.2)} {...cizgi} />
        <Ok x={n(xc)} y={n(Y(hD))} ux={0} uy={1} />
      </g>
    );
  }

  return <Surukle id="g-tol" offsets={dimOff} setOffsets={setDimOff}>{e}</Surukle>;
}
