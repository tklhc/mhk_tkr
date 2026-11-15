import { takimProfili } from "../geometry/profil";
import { disProfiliGeometri } from "../geometry/disProfili";
import { olcekSec, olcekYaz } from "./sayfaDuzeni";
import { CIZGI, YAZI, DESEN, AciOlcusu, Kilavuz, fmt } from "./iso";
import { kaplamaRengi, ton } from "./stil";
import { Surukle } from "./Draggable";

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

  // Açı ölçüleri (ekran açısı: saat yönü +, aşağı = 90°)
  const taban0 = yon > 0 ? 0 : 180;                         // teğet çizgisinin yönü
  const ekranAci = (a) => (yon > 0 ? a : 180 - a);
  const gAci = yon > 0 ? 90 - gamma / (Math.PI / 180) : 90 + gamma / (Math.PI / 180);
  const derece = (r) => (r * 180) / Math.PI;
  const rs = Math.min(0.5 * rr, 10);
  const yaz = (v) => `${fmt(v)}°`;

  const solX = cx + yon * (rr + 3);                         // etiketler pencerenin topuk tarafında
  const lbl = (dy) => [solX, cy + dy * rr];

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

      {/* Açılar: γ (talaş yüzeyi ↔ radyal), α₁ (1. SY ↔ teğet), α₂ (2. SY ↔ teğet) */}
      <AciOlcusu id="dpG" cx={Px} cy={Py} r={rs} a1={90} a2={gAci} metinAci={yon > 0 ? 112 : 68} metin={`γ ${yaz(derece(gamma))}`} {...ek} />
      <AciOlcusu id="dpA1" cx={Px} cy={Py} r={rs * 0.8} a1={taban0} a2={ekranAci(derece(a1))} metinAci={yon > 0 ? -14 : 194} metin={`α₁ ${yaz(derece(a1))}`} {...ek} />
      {ikinci && <AciOlcusu id="dpA2" cx={Ax} cy={Ay} r={rs * 0.55} a1={taban0} a2={ekranAci(derece(a2))} metinAci={yon > 0 ? -14 : 194} metin={`α₂ ${yaz(derece(a2))}`} {...ek} />}

      {/* Genişlikler: kılavuz çizgisi, serbest yüzeyin ortasına */}
      <Kilavuz id="dpW1" hedef={[n((Px + Ax) / 2), n((Py + Ay) / 2)]} dirsek={lbl(-0.7).map(n)} metin={`1. SY  ${fmt(w1)}`} {...ek} />
      {ikinci && <Kilavuz id="dpW2" hedef={[n((Ax + Bx) / 2), n((Ay + By) / 2)]} dirsek={lbl(-0.35).map(n)} metin={`2. SY  ${fmt(w2)}`} {...ek} />}

      <text x={cx} y={n(cy + rr + 4.5)} textAnchor="middle" fontSize={YAZI.etiket + 0.5} fontFamily={YAZI.font} fill={CIZGI.renk} fontWeight="700">
        DİŞ PROFİLİ DETAYI ({olcekYaz(sc)})
      </text>
      <text x={cx} y={n(cy + rr + 8.2)} textAnchor="middle" fontSize={2.3} fontFamily={YAZI.font} fill="#666">
        şematik · genişlik mm, açı °
      </text>
    </Surukle>
  );
}
