import { takimProfili, tamKontur, svgYolu } from "../geometry/profil";
import { olcekSec, olcekYaz } from "./sayfaDuzeni";
import { CIZGI, YAZI, Kilavuz, fmt } from "./iso";
import { kaplamaRengi, ton } from "./stil";

const n = (v) => +v.toFixed(3);

/**
 * Büyütülmüş detay gerektiren uç özelliği (radyüs, pah, rayba girişi, matkap ucu).
 * Koordinatlar model uzayında (x: eksen, r: yarıçap, mm).
 * @returns {null | { cx: number, cr: number, yaricap: number, hedef: number[], metin: string }}
 */
export function detayOzelligi(params, g) {
  const hD = g.D / 2;
  if (g.tip === "bullnose" && params.rCorner > 0) {
    const r = params.rCorner;
    return { cx: g.L - r, cr: hD - r, yaricap: r * 1.6, hedef: [g.L - r + r * Math.SQRT1_2, hD - r + r * Math.SQRT1_2], metin: `R${fmt(r)}` };
  }
  if ((g.tip === "chamfer" || g.tip === "reamer") && params.chamferSize > 0) {
    const c = params.chamferSize;
    return { cx: g.L - c / 2, cr: hD - c / 2, yaricap: c * 1.6, hedef: [g.L - c / 2, hD - c / 2], metin: `${fmt(c)}×45°` };
  }
  if (g.tip === "drill") {
    const pa = params.pointAngle || 140;
    const uc = hD / Math.tan((pa / 2) * (Math.PI / 180));
    return { cx: g.L - uc / 2, cr: hD / 2, yaricap: 1.25 * Math.hypot(uc / 2, hD / 2), hedef: [g.L - uc / 2, hD / 2], metin: `${fmt(pa)}°` };
  }
  return null;
}

/** Yan görünüşte ucun üzerine ince daire + "A", sayfada büyütülmüş detay. */
export function DetayA({ params, yerlesim, harf = "A", dimOff, setDimOff }) {
  const g = takimProfili(params);
  if (!(g.D > 0) || !(g.L > 0) || params.detayA === false) return null;
  const f = detayOzelligi(params, g);
  if (!f) return null;

  const { olcek: s, ox, oy, bolge } = yerlesim;
  const X = (x) => ox + x * s;
  const Y = (r) => oy - r * s;
  const hmax = Math.max(g.D, g.d) / 2;
  const alt = oy + hmax * s;

  // Boş yer: ölçü satırlarının altı ile bölgenin alt kenarı arası
  const bos = bolge.y + bolge.h - 4 - (alt + 26);
  const rr = Math.min(17, bos / 2);
  if (rr < 10) return null;

  const rReal = Math.max(f.yaricap, 0.4);
  const s2 = olcekSec([[rReal, rr]]);
  if (s2 <= s) return null;                       // büyütme yok: detay gereksiz
  const px = Math.min(bolge.x + bolge.w - rr - 4, X(g.L));
  const py = bolge.y + bolge.h - rr - 6;
  const P = (x, r) => [px + (x - f.cx) * s2, py - (r - f.cr) * s2];

  const yol = svgYolu(tamKontur(g), (x, r) => P(x, r).map(n)) + " Z";
  const klip = "detay-klip";
  const [hx, hy] = P(f.hedef[0], f.hedef[1]);
  const ek = { offsets: dimOff, setOffsets: setDimOff };
  const sol = hx < px;

  return (
    <g>
      {/* Yan görünüşte işaret: ince daire + harf */}
      <circle cx={n(X(f.cx))} cy={n(Y(f.cr))} r={n(rReal * s)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <text x={n(X(f.cx) - rReal * s - 4.5)} y={n(Y(f.cr) + 1.2)} fontSize={3.5} fontFamily={YAZI.font} fill={CIZGI.renk} fontWeight="700">{harf}</text>

      {/* Detay */}
      <defs><clipPath id={klip}><circle cx={px} cy={py} r={rr} /></clipPath></defs>
      <circle cx={px} cy={py} r={rr} fill="#fff" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <path d={yol} clipPath={`url(#${klip})`} fill={params.sunum !== false ? ton(kaplamaRengi(params.coating, params.colCut), 38) : "none"} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />
      <Kilavuz id="aDetay" hedef={[n(hx), n(hy)]} dirsek={[n(px + (sol ? -rr * 0.75 : rr * 0.75)), n(py - rr * 0.75)]} metin={f.metin} {...ek} />
      <text x={px} y={n(py + rr + 4.5)} textAnchor="middle" fontSize={YAZI.etiket + 0.5} fontFamily={YAZI.font} fill={CIZGI.renk} fontWeight="700">
        DETAY {harf} ({olcekYaz(s2)})
      </text>
    </g>
  );
}
