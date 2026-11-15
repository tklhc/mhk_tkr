import { takimProfili } from "../geometry/profil";
import { disProfiliGeometri } from "../geometry/disProfili";
import { olcekSec, olcekYaz } from "./sayfaDuzeni";
import { CIZGI, YAZI, DESEN, Kilavuz, fmt } from "./iso";
import { kaplamaRengi, ton } from "./stil";
import { Surukle } from "./Draggable";
import { mt } from "./metinler";

const n = (v) => +v.toFixed(3);

/** Diş profili detayı çizilecek mi? Yalnız iş emri çiziminde, kapatılmamışsa ve yeterli veri varsa. */
export function disProfiliGorunsun(params, g) {
  return params.cizimTuru === "ie" && params.disProfili !== false && !!disProfiliGeometri(params, g);
}

/**
 * Diş profili detayı: kesici kenar çevresinin uçtan kesiti, büyütülmüş. Kesme açısı γ, 1. ve 2. serbest
 * yüzeyin genişliği ve açısı iş emri değerleriyle ölçeklidir; kanal tabanı ve arka duvar şematiktir.
 * Yan görünüş bölgesinin sol altına konur, sürüklenebilir.
 */
export function DisProfili({ params, yerlesim, dimOff, setDimOff }) {
  const g = takimProfili(params);
  if (!disProfiliGorunsun(params, g)) return null;
  const gm = disProfiliGeometri(params, g);
  const { olcek: s0, oy, bolge } = yerlesim;

  // Boş yer: ölçü satırlarının altı ile bölgenin alt kenarı arası (DetayA ile aynı hesap)
  const hmax = Math.max(g.D, g.d) / 2;
  const bos = bolge.y + bolge.h - 4 - (oy + hmax * s0 + 26);
  const rr = Math.min(26, bos / 2);
  if (rr < 10) return null;

  const yon = params.cutDir === "Sol" ? -1 : 1;           // topuk yönü: sağ kesimde +x
  const { R, rc, A, B, Ff, H, FfSonraki, gamma, a1, a2, w1, w2, ikinci } = gm;
  const genislik = Math.max(Math.abs(B[0]), 0.5);
  const sc = olcekSec([[genislik, 1.35 * rr]]);           // kenar boyu pencerenin ~%70'ine sığan ölçek
  const cx = bolge.x + 46 + rr, cy = bolge.y + bolge.h - rr - 13;
  const px = cx - yon * (sc * B[0] / 2 - 5), py = cy - 0.3 * rr; // P: kesici kenar (kâğıtta)
  const T = ([u, v]) => [px + yon * sc * u, py + sc * v];
  const [Px, Py] = T([0, 0]), [Ax, Ay] = T(A), [Bx, By] = T(B), [Fx, Fy] = T(Ff), [Hx, Hy] = T(H), [Nx, Ny] = T(FfSonraki);
  const [Ox, Oy] = T([0, R]);
  const klip = "dis-klip", tarama = "dis-tarama";
  const sunum = params.sunum !== false;
  const dolgu = sunum ? ton(kaplamaRengi(params.coating, params.colCut), 38) : `url(#${tarama})`;
  const ek = { offsets: dimOff, setOffsets: setDimOff };

  // Çekirdek tabanı yayı: H → sonraki dişin talaş ayağı (u yönü yon ile aynalanır)
  const taban = `M ${n(Hx)} ${n(Hy)} A ${n(rc * sc)} ${n(rc * sc)} 0 0 ${yon > 0 ? 1 : 0} ${n(Nx)} ${n(Ny)}`;
  const govde = `M ${n(Fx)} ${n(Fy)} L ${n(Px)} ${n(Py)} L ${n(Ax)} ${n(Ay)} L ${n(Bx)} ${n(By)} L ${n(Hx)} ${n(Hy)} Z`;
  const yuzey = `M ${n(Fx)} ${n(Fy)} L ${n(Px)} ${n(Py)} L ${n(Ax)} ${n(Ay)} L ${n(Bx)} ${n(By)} L ${n(Hx)} ${n(Hy)}`;

  // Açı yayları (ekran açısı: saat yönü +, aşağı = 90°). Küçük açılarda ok sığmaz: ince yay + kılavuz yazısı
  const taban0 = yon > 0 ? 0 : 180;                         // teğet çizgisinin yönü
  const ekranAci = (a) => (yon > 0 ? a : 180 - a);
  const derece = (r) => (r * 180) / Math.PI;
  const gAci = yon > 0 ? 90 - derece(gamma) : 90 + derece(gamma);
  const yay = (mx, my, r, aA, aB) => {
    const nk = (a) => [mx + r * Math.cos((a * Math.PI) / 180), my + r * Math.sin((a * Math.PI) / 180)];
    const [x1, y1] = nk(aA), [x2, y2] = nk(aB);
    return `M ${n(x1)} ${n(y1)} A ${n(r)} ${n(r)} 0 0 ${aB > aA ? 1 : 0} ${n(x2)} ${n(y2)}`;
  };
  const boy1 = Math.hypot(Ax - Px, Ay - Py), boy2 = Math.hypot(Bx - Ax, By - Ay);
  const yayStil = { fill: "none", stroke: CIZGI.renk, strokeWidth: 0.3 };

  const onX = cx - yon * (rr + 3), arkaX = cx + yon * (rr + 3);   // etiket sütunları: talaş (ön) tarafı ve topuk (arka) tarafı
  const lbl = (x, dy) => [x, cy + dy * rr];

  return (
    <Surukle id="g-dis" offsets={dimOff} setOffsets={setDimOff} kutu={[cx - rr - 1, cy - rr - 1, 2 * rr + 2, 2 * rr + 8]}>
      <defs>
        <clipPath id={klip}><circle cx={cx} cy={cy} r={rr} /></clipPath>
        <pattern id={tarama} patternUnits="userSpaceOnUse" width={1.4} height={1.4} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={1.4} stroke={CIZGI.renk} strokeWidth={0.2} />
        </pattern>
      </defs>
      <circle cx={cx} cy={cy} r={rr} fill="#fff" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <g clipPath={`url(#${klip})`}>
        {/* Malzeme: diş gövdesi + çekirdek dairesi */}
        <path d={govde} fill={dolgu} stroke="none" />
        <circle cx={n(Ox)} cy={n(Oy)} r={n(rc * sc)} fill={dolgu} stroke="none" />
        {/* Kenar çevresi: talaş yüzeyi, serbest yüzeyler, topuk ve kanal tabanı */}
        <path d={yuzey} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />
        <path d={taban} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />
        {/* Başvuru çizgileri: dış çap dairesi, radyal ve teğet doğrular (ince, kesik) */}
        <circle cx={n(Ox)} cy={n(Oy)} r={n(R * sc)} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />
        <line x1={n(Px)} y1={n(Py)} x2={n(Px)} y2={n(Py + rr)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />
        <line x1={n(Px)} y1={n(Py)} x2={n(Px + yon * rr)} y2={n(Py)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />
        {ikinci && <line x1={n(Ax)} y1={n(Ay)} x2={n(Ax + yon * rr * 0.8)} y2={n(Ay)} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.gizli} />}
      </g>
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />

      {/* Açılar: ince yaylar (okları sığmaz) + her biri kılavuz çizgisiyle tam adı ve değeriyle yazılır */}
      <path d={yay(Px, Py, Math.min(12, 0.5 * rr), 90, gAci)} {...yayStil} />
      <path d={yay(Px, Py, Math.min(0.92 * boy1, 12), taban0, ekranAci(derece(a1)))} {...yayStil} />
      {ikinci && <path d={yay(Ax, Ay, Math.min(0.92 * boy2, 11), taban0, ekranAci(derece(a2)))} {...yayStil} />}

      <Kilavuz id="dpGk" hedef={[n((Px + Fx) / 2), n((Py + Fy) / 2)]} dirsek={lbl(onX, 0.25).map(n)} metin={`${mt(params, "kesme_acisi")}  ${fmt(derece(gamma))}°`} {...ek} />
      <Kilavuz id="dpW1" hedef={[n((Px + Ax) / 2), n((Py + Ay) / 2)]} dirsek={lbl(arkaX, -0.7).map(n)} metin={`${mt(params, "sy1")}  ${fmt(w1)} mm / ${fmt(derece(a1))}°`} {...ek} />
      {ikinci && <Kilavuz id="dpW2" hedef={[n((Ax + Bx) / 2), n((Ay + By) / 2)]} dirsek={lbl(arkaX, -0.3).map(n)} metin={`${mt(params, "sy2")}  ${fmt(w2)} mm / ${fmt(derece(a2))}°`} {...ek} />}

      <text x={cx} y={n(cy + rr + 4.5)} textAnchor="middle" fontSize={YAZI.etiket + 0.5} fontFamily={YAZI.font} fill={CIZGI.renk} fontWeight="700">
        {mt(params, "dis_profili")} ({olcekYaz(sc)})
      </text>
      <text x={cx} y={n(cy + rr + 8.2)} textAnchor="middle" fontSize={2.3} fontFamily={YAZI.font} fill="#666">
        {mt(params, "sematik_dis")}
      </text>
    </Surukle>
  );
}
