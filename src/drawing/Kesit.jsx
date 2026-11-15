import { takimProfili, yaricapAt } from "../geometry/profil";
import { OLCEKLER, olcekYaz } from "./sayfaDuzeni";
import { CIZGI, DESEN, YAZI, Ok, Olcu } from "./iso";
import { kanalYolu } from "./kanalYolu";

const n = (v) => +v.toFixed(3);

/** Kanallı bölümde kesit alınabilir mi (çekirdek tanımlı, kesici bölüm var)? */
export function kesitVarMi(params, g) {
  return params.kesitAA !== false && params.dCore > 0 && params.dCore < g.D && params.z >= 1 && g.L - g.x.boyunSonu > 1;
}

/**
 * Kesit A-A: kanallı bölümün ortasından kesme düzlemi (yan görünüşte kalın uçlu
 * eksen çizgisi + oklar) ve taralı kesit görünüşü (uç görünüşün altında).
 * Kesit, uç görünüşle aynı basitleştirilmiş kanal profilini kullanır.
 */
export function Kesit({ params, yan, uc, dimOff, setDimOff }) {
  const g = takimProfili(params);
  if (!(g.D > 0) || !kesitVarMi(params, g)) return null;

  const xs = g.x.boyunSonu + 0.7 * (g.L - g.x.boyunSonu); // kesme düzlemi: kanallı bölümün %70'i (ortadaki l1 ölçü yazısına binmesin)
  const Rmm = yaricapAt(g, xs);
  if (!(Rmm > params.dCore / 2)) return null;

  // ── Yan görünüşte kesme düzlemi ──
  const { olcek: s, ox, oy } = yan;
  const hmax = Math.max(g.D, g.d) / 2;
  const px = ox + xs * s;
  const yU = oy - hmax * s - 3, yA = oy + hmax * s + 4;
  const KALIN = 4, OK_BOY = 6;
  const harfStil = { fontSize: 3.5, fontFamily: YAZI.font, fill: CIZGI.renk, fontWeight: 700, textAnchor: "middle" };

  // ── Kesit görünüşünün yeri: uç görünüşün altı ──
  const RendMm = g.D / 2;
  const cyUst = uc.cy + RendMm * uc.olcek + 26;    // uç görünüşün başlığının altı
  const alt = uc.bolge.y + uc.bolge.h - 3;
  let sk = null;
  for (const o of OLCEKLER) {
    if (o > uc.olcek) continue;
    const Rk = Rmm * o;
    if (cyUst + 2 * Rk + 16 <= alt) { sk = o; break; }
  }
  const harf = "A";
  let kesitGoruntusu = null;
  if (sk) {
    const Rk = Rmm * sk, rck = (params.dCore / 2) * sk;
    const cx = uc.cx, cy = cyUst + Rk + 6;
    const yon = params.cutDir === "Sol" ? -1 : 1;
    const z = Math.max(1, Math.round(params.z));
    const d = kanalYolu({ cx, cy, R: Rk, rc: Math.min(rck, Rk * 0.95), z, yon });
    kesitGoruntusu = (
      <g>
        <defs>
          <pattern id="kesit-tarama" patternUnits="userSpaceOnUse" width={1.4} height={1.4} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={1.4} stroke={CIZGI.renk} strokeWidth={0.2} />
          </pattern>
        </defs>
        <path d={d} fill="url(#kesit-tarama)" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />
        <Olcu id="kD" yon="yatay" p1={[cx - Rk, cy]} p2={[cx + Rk, cy]} konum={cy + Rk + 7} deger={Rmm * 2} onEk="⌀" anma={Rmm * 2}
          offsets={dimOff} setOffsets={setDimOff} />
        <text x={n(cx)} y={n(cy + Rk + 16)} textAnchor="middle" fontSize={YAZI.etiket + 0.5} fontFamily={YAZI.font} fill={CIZGI.renk} fontWeight="700">
          KESİT {harf}-{harf} ({olcekYaz(sk)})
        </text>
      </g>
    );
  }

  return (
    <g>
      {/* Kesme düzlemi: ince eksen çizgisi, uçlarda kalın parça ve bakış yönünü gösteren oklar (sağa) */}
      <line x1={n(px)} y1={n(yU)} x2={n(px)} y2={n(yA)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.eksen} />
      <line x1={n(px)} y1={n(yU)} x2={n(px)} y2={n(yU + KALIN)} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />
      <line x1={n(px)} y1={n(yA)} x2={n(px)} y2={n(yA - KALIN)} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />
      <line x1={n(px)} y1={n(yU)} x2={n(px + OK_BOY)} y2={n(yU)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <line x1={n(px)} y1={n(yA)} x2={n(px + OK_BOY)} y2={n(yA)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <Ok x={n(px + OK_BOY)} y={n(yU)} ux={1} uy={0} />
      <Ok x={n(px + OK_BOY)} y={n(yA)} ux={1} uy={0} />
      <text x={n(px - 2.5)} y={n(yU - 1)} {...harfStil}>{harf}</text>
      <text x={n(px - 2.5)} y={n(yA + 4.2)} {...harfStil}>{harf}</text>
      {kesitGoruntusu}
    </g>
  );
}
