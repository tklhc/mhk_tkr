import { takimProfili } from "../geometry/profil";
import { CIZGI, Eksen, Olcu, DESEN, YAZI, fmt } from "./iso";
import { olcekYaz } from "./sayfaDuzeni";

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

  // Kanallar: her kanal, çekirdek dairesine teğet ve dış çapı kesen bir daire yayıdır.
  // Dış kontur yalnız saplar (land) üzerinde dış çapı izler.
  if (dCore > 0) {
    const f = 0.42;                                   // kanalın, bir diş aralığındaki payı
    let delta = (f * Math.PI) / z;                    // kanalın dış çapı kestiği yarı açı
    if (R * Math.cos(delta) <= rc * 1.05) delta = Math.acos(Math.min(0.98, (rc * 1.15) / R));
    const m = (R * R - rc * rc) / (2 * (R * Math.cos(delta) - rc)); // kanal dairesinin merkez uzaklığı
    const kr = m - rc;                                // kanal yarıçapı
    const P = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const norm = (v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const aci = (i) => -Math.PI / 2 + yon * ((2 * Math.PI * i) / z) + yon * 0.1; // kanal ekseni (ekran açısı, saat yönü +)
    const giris = (i) => P(aci(i) - yon * delta, R);
    const cikis = (i) => P(aci(i) + yon * delta, R);
    const landBuyuk = 2 * Math.PI / z - 2 * delta > Math.PI ? 1 : 0;
    let d = `M ${n(cikis(0)[0])} ${n(cikis(0)[1])} `;
    for (let i = 1; i <= z; i++) {
      const k = i % z;
      const [gx, gy] = giris(k), [qx, qy] = cikis(k);
      // sap: önceki kanalın çıkışından bu kanalın girişine, dış çap üzerinde
      d += `A ${n(R)} ${n(R)} 0 ${landBuyuk} ${yon > 0 ? 1 : 0} ${n(gx)} ${n(gy)} `;
      // kanal: giriş → çıkış, çekirdeğe bakan (merkeze yakın) yaydan
      const km = P(aci(k), m);
      const f1 = Math.atan2(gy - km[1], gx - km[0]);
      const f2 = Math.atan2(qy - km[1], qx - km[0]);
      const fq = Math.atan2(cy - km[1], cx - km[0]);
      const ileri = norm(f2 - f1);
      const merkezIleri = norm(fq - f1) < ileri;
      const aciFarki = merkezIleri ? ileri : 2 * Math.PI - ileri;
      d += `A ${n(kr)} ${n(kr)} 0 ${aciFarki > Math.PI ? 1 : 0} ${merkezIleri ? 1 : 0} ${n(qx)} ${n(qy)} `;
    }
    e.push(<path key="dis" d={d + "Z"} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />);
    e.push(<circle key="core" cx={cx} cy={cy} r={n(rc)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />);
  } else {
    e.push(<circle key="dis" cx={cx} cy={cy} r={n(R)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />);
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
    e.push(<Olcu key="uD" id="uD" yon="yatay" p1={[cx - R, cy + R * 0.0]} p2={[cx + R, cy + R * 0.0]}
      konum={cy + R + 8} deger={D} onEk="⌀" tol={stepdrill ? "" : params.tolD} anma={D}
      offsets={dimOff} setOffsets={setDimOff} />);
  }

  e.push(
    <text key="et" x={cx} y={n(cy + R + 18)} textAnchor="middle" fontSize={YAZI.etiket} fontFamily={YAZI.font} fill={CIZGI.renk}>
      UÇTAN GÖRÜNÜŞ ({olcekYaz(s)}){dCore > 0 ? `  ·  dc ${fmt(dCore)}` : ""}  ·  {z} Z
    </text>
  );
  return <g>{e}</g>;
}
