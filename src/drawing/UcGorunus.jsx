import { takimProfili } from "../geometry/profil";
import { CIZGI, Eksen, Olcu, DESEN, YAZI, fmt } from "./iso";
import { olcekYaz } from "./sayfaDuzeni";
import { kaplamaRengi, ton } from "./stil";
import { kanalYolu } from "./kanalYolu";
import { mt } from "./metinler";

const n = (v) => +v.toFixed(3);

/**
 * Uçtan görünüş (vektör): dış çap, çekirdek, z adet kanal ve soğutma delikleri.
 * Kanallar, çekirdeğe teğet olacak şekilde dış çapı kesen daire olarak
 * basitleştirilmiştir (kanal profili kesit şablonu değildir).
 */
export function UcGorunus({ params, yerlesim, dimOff, setDimOff }) {
  const g = takimProfili(params);
  const D = g.D;
  if (!(D > 0)) return null;
  const { olcek: s, cx, cy } = yerlesim;
  const R = (D / 2) * s;
  const stepdrill = g.tip === "stepdrill";
  const drill = g.tip === "drill" || stepdrill;
  const z = Math.max(1, Math.round(params.z || 1));
  const dCore = params.dCore > 0 && params.dCore < D ? params.dCore : 0;
  const rc = (dCore / 2) * s;
  const yon = params.cutDir === "Sol" ? -1 : 1;
  const e = [];
  const sunum = params.sunum !== false;
  const dolgu = sunum ? "url(#ys-uc)" : "none";
  if (sunum) {
    const renk = kaplamaRengi(params.coating, params.colCut);
    e.push(
      <defs key="ys-uc-defs">
        <radialGradient id="ys-uc" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={ton(renk, 62)} /><stop offset="55%" stopColor={ton(renk, 6)} /><stop offset="100%" stopColor={ton(renk, -52)} />
        </radialGradient>
      </defs>
    );
  }

  // Kanallı kontur: bkz. kanalYolu.js
  if (dCore > 0) {
    const d = kanalYolu({ cx, cy, R, rc, z, yon });
    e.push(<path key="dis" d={d} fill={dolgu} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />);
    e.push(<circle key="core" cx={cx} cy={cy} r={n(rc)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />);
  } else {
    e.push(<circle key="dis" cx={cx} cy={cy} r={n(R)} fill={dolgu} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />);
  }

  // Matkapta keski kenarı
  if (drill && dCore > 0) {
    e.push(<line key="keski" x1={n(cx - rc)} y1={cy} x2={n(cx + rc)} y2={cy} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />);
  }

  // Soğutma delikleri
  if (params.coolantHole && params.coolantCount > 0) {
    const m = params.coolantCount;
    const dr = Math.min(R * 0.1, 1.2);
    const mr = R * 0.55;
    for (let i = 0; i < m; i++) {
      const a = (2 * Math.PI * i) / m - Math.PI / 2;
      e.push(<circle key={`c${i}`} cx={n(cx + mr * Math.cos(a))} cy={n(cy + mr * Math.sin(a))} r={n(dr)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />);
    }
  }

  // Eksenler
  e.push(<Eksen key="eh" x1={n(cx - R - 4)} y1={cy} x2={n(cx + R + 4)} y2={cy} />);
  e.push(<Eksen key="ev" x1={cx} y1={n(cy - R - 4)} x2={cx} y2={n(cy + R + 4)} />);

  // Çap ölçüsü (altta, yatay) ve çekirdek
  if (params.showDimD) {
    e.push(<Olcu key="uD" id="uD" alan="D" yon="yatay" p1={[cx - R, cy + R * 0.0]} p2={[cx + R, cy + R * 0.0]}
      konum={cy + R + 8} deger={D} onEk="⌀" tol={stepdrill ? "" : params.tolD} anma={D}
      offsets={dimOff} setOffsets={setDimOff} />);
  }

  e.push(
    <text key="et" x={cx} y={n(cy + R + 18)} textAnchor="middle" fontSize={YAZI.etiket} fontFamily={YAZI.font} fill={CIZGI.renk}>
      {mt(params, "uc_gorunus")} ({olcekYaz(s)}){dCore > 0 ? `  ·  dc ${fmt(dCore)}` : ""}  ·  {z} Z
    </text>
  );
  return <g>{e}</g>;
}
