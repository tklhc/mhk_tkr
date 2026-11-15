const n = (v) => +v.toFixed(3);
const norm = (v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

/**
 * Kanallı kesitin dış konturu (SVG path, kapalı). Her kanal, çekirdek dairesine
 * teğet ve dış çapı kesen bir daire yayıdır; dış çap yalnız saplar (land) üzerinde izlenir.
 * @param {{cx:number, cy:number, R:number, rc:number, z:number, yon:number}} o
 *   R, rc: dış ve çekirdek yarıçapı (çizim birimi); yon: +1 sağ kesim, -1 sol
 */
export function kanalYolu({ cx, cy, R, rc, z, yon }) {
  const f = 0.42;                                  // kanalın, bir diş aralığındaki payı
  let delta = (f * Math.PI) / z;                   // kanalın dış çapı kestiği yarı açı
  if (R * Math.cos(delta) <= rc * 1.05) delta = Math.acos(Math.min(0.98, (rc * 1.15) / R));
  const m = (R * R - rc * rc) / (2 * (R * Math.cos(delta) - rc)); // kanal dairesinin merkez uzaklığı
  const kr = m - rc;                               // kanal yarıçapı
  const P = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const aci = (i) => -Math.PI / 2 + yon * ((2 * Math.PI * i) / z) + yon * 0.1; // kanal ekseni (ekran açısı, saat yönü +)
  const giris = (i) => P(aci(i) - yon * delta, R);
  const cikis = (i) => P(aci(i) + yon * delta, R);
  const landBuyuk = (2 * Math.PI) / z - 2 * delta > Math.PI ? 1 : 0;
  let d = `M ${n(cikis(0)[0])} ${n(cikis(0)[1])} `;
  for (let i = 1; i <= z; i++) {
    const k = i % z;
    const [gx, gy] = giris(k), [qx, qy] = cikis(k);
    d += `A ${n(R)} ${n(R)} 0 ${landBuyuk} ${yon > 0 ? 1 : 0} ${n(gx)} ${n(gy)} `;
    const km = P(aci(k), m);
    const f1 = Math.atan2(gy - km[1], gx - km[0]);
    const f2 = Math.atan2(qy - km[1], qx - km[0]);
    const fq = Math.atan2(cy - km[1], cx - km[0]);
    const ileri = norm(f2 - f1);
    const merkezIleri = norm(fq - f1) < ileri;
    const aciFarki = merkezIleri ? ileri : 2 * Math.PI - ileri;
    d += `A ${n(kr)} ${n(kr)} 0 ${aciFarki > Math.PI ? 1 : 0} ${merkezIleri ? 1 : 0} ${n(qx)} ${n(qy)} `;
  }
  return d + "Z";
}
