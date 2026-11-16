import { takimProfili, tamKontur, svgYolu } from "../geometry/profil";
import { KAGITLAR } from "./sayfaDuzeni";
import { CIZGI, YAZI, fmt } from "./iso";
import { kaplamaRengi, ton } from "./stil";
import { mt } from "./metinler";
import { logoAl } from "../assets/images";
import { FIRMA } from "../config";
import { sigdir, tarihYaz } from "./Antet";

const n = (v) => +v.toFixed(2);
const KENAR = 12, USTBANT = 22, ALTBANT = 10, BOSLUK = 3;

/** Bir sayfaya sığan takım sayısı ve ızgara (sütun × satır). */
export function katalogIzgara(sutun, kagit = "A4") {
  const k = KAGITLAR[kagit] || KAGITLAR.A4;
  const s = Math.min(Math.max(Math.round(sutun) || 3, 2), 4);
  const satir = s >= 4 ? 4 : 3;
  const w = k.w - 2 * KENAR, h = k.h - 2 * KENAR - USTBANT - ALTBANT - BOSLUK;
  return { sutun: s, satir, adet: s * satir, hucreW: (w - (s - 1) * BOSLUK) / s, hucreH: (h - (satir - 1) * BOSLUK) / satir, kagit: k };
}

/** Takımları sayfalara böler: [[takım, ...], ...]. Boş liste tek boş sayfa verir. */
export function katalogSayfalari(takimlar, sutun, kagit) {
  const { adet } = katalogIzgara(sutun, kagit);
  const sayfalar = [];
  for (let i = 0; i < takimlar.length; i += adet) sayfalar.push(takimlar.slice(i, i + adet));
  return sayfalar.length ? sayfalar : [[]];
}

/** Hücredeki küçük yan görünüş: profil kontur yolu, kesici bölüm kaplama renginde. */
function KucukTakim({ t, x, y, w, h, id }) {
  const g = takimProfili(t);
  if (!(g.D > 0) || !(g.d > 0) || !(g.L > 0) || g.hatalar.length > 0) {
    return <text x={n(x + w / 2)} y={n(y + h / 2)} textAnchor="middle" fontSize={2.8} fontFamily={YAZI.font} fill="#999">—</text>;
  }
  const hmax = Math.max(g.D, g.d) / 2;
  const s = Math.min(w / g.L, h / (2 * hmax));
  const ox = x + (w - g.L * s) / 2, oy = y + h / 2;
  const yol = svgYolu(tamKontur(g), (px, r) => [n(ox + px * s), n(oy - r * s)]) + " Z";
  const kesiciX = ox + g.x.boyunSonu * s;
  const renk = kaplamaRengi(t.coating, t.colCut);
  const klip = `kat-klip-${id}`;
  // Oluk izleri: helis açısına göre eğik ince çizgiler (yalnız kanallı bölümde)
  const egim = Math.tan(((t.helix || 0) * Math.PI) / 180);
  const cizgiler = [];
  if (t.helix > 0 && g.tip !== "stepdrill" && g.x.boyunSonu < g.L) {
    const adim = Math.max(hmax * s * 0.9, 1.6);
    for (let cx = kesiciX - 2 * hmax * s; cx < ox + g.L * s; cx += adim) {
      cizgiler.push(<line key={cx} x1={n(cx)} y1={n(oy + hmax * s)} x2={n(cx + (2 * hmax * s) / Math.max(egim, 0.2))} y2={n(oy - hmax * s)} />);
    }
  }
  return (
    <g>
      <defs><clipPath id={klip}><path d={yol} /></clipPath></defs>
      <path d={yol} fill="#dde1e7" stroke="none" />
      <g clipPath={`url(#${klip})`}>
        <rect x={n(kesiciX)} y={n(oy - hmax * s)} width={n(ox + g.L * s - kesiciX)} height={n(2 * hmax * s)} fill={ton(renk, 38)} />
        <g stroke={CIZGI.renk} strokeWidth={0.18} opacity={0.55} clipPath={`url(#${klip})`}>{cizgiler}</g>
      </g>
      <path d={yol} fill="none" stroke={CIZGI.renk} strokeWidth={0.35} strokeLinejoin="round" />
      <line x1={n(ox - 2)} y1={n(oy)} x2={n(ox + g.L * s + 2)} y2={n(oy)} stroke={CIZGI.renk} strokeWidth={0.15} strokeDasharray="6 1 0.5 1" />
    </g>
  );
}

/**
 * Katalog sayfası: üst bantta logo ve başlık, ızgarada her takımın küçük resmi + adı ve temel özellikleri,
 * altta firma iletişimi ve sayfa numarası. Birim mm; svg id'si `katalog-svg` (dışa aktarma için).
 * @param {{ id?: string, takimlar: object[], sayfa: number, sayfaSayisi: number, baslik: string, sutun: number, dil: string, kagit?: string, tarih?: string }} p
 */
export function KatalogSayfasi({ id = "katalog-svg", takimlar, sayfa = 1, sayfaSayisi = 1, baslik = "", sutun = 3, dil = "tr", kagit = "A4", tarih = "" }) {
  const dp = { dil };
  const iz = katalogIzgara(sutun, kagit);
  const { kagit: k } = iz;
  const yan = fmt;
  return (
    <svg id={id} viewBox={`0 0 ${k.w} ${k.h}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x={0} y={0} width={k.w} height={k.h} fill="#fff" />
      {/* Üst bant */}
      <image href={logoAl()} x={KENAR} y={KENAR - 2} width={38} height={USTBANT - 4} preserveAspectRatio="xMinYMid meet" />
      <text x={KENAR + 44} y={KENAR + 8} fontSize={8} fontWeight={700} fontFamily={YAZI.font} fill="#000">{baslik || mt(dp, "kat_katalog")}</text>
      <text x={k.w - KENAR} y={KENAR + 6} textAnchor="end" fontSize={3.2} fontFamily={YAZI.font} fill="#444">{tarihYaz(tarih)}</text>
      <line x1={KENAR} y1={KENAR + USTBANT - 2} x2={k.w - KENAR} y2={KENAR + USTBANT - 2} stroke="#000" strokeWidth={0.5} />

      {/* Izgara */}
      {takimlar.map((t, i) => {
        const c = i % iz.sutun, r = Math.floor(i / iz.sutun);
        const x = KENAR + c * (iz.hucreW + BOSLUK), y = KENAR + USTBANT + BOSLUK + r * (iz.hucreH + BOSLUK);
        const g = takimProfili(t);
        const ad = t.toolName || "";
        const resimH = iz.hucreH * 0.46;
        const satirlar = [
          g.D > 0 && g.L > 0 ? `⌀${yan(g.D)} × ${yan(g.L)} mm` : "",
          [t.z > 0 ? `${t.z} ${mt(dp, "kat_dis")}` : "", t.helix > 0 ? `${mt(dp, "helis")} ${yan(t.helix)}°` : ""].filter(Boolean).join("  ·  "),
          [t.material, t.coating].filter(Boolean).join("  ·  "),
          t.drawingNo ? `${mt(dp, "kat_cizim_no")}: ${t.drawingNo}` : "",
        ].filter(Boolean);
        return (
          <g key={i}>
            <rect x={n(x)} y={n(y)} width={n(iz.hucreW)} height={n(iz.hucreH)} fill="none" stroke="#9aa3ae" strokeWidth={0.3} />
            <KucukTakim t={t} id={`${sayfa}-${i}`} x={x + 4} y={y + 4} w={iz.hucreW - 8} h={resimH - 4} />
            <line x1={n(x)} y1={n(y + resimH + 2)} x2={n(x + iz.hucreW)} y2={n(y + resimH + 2)} stroke="#c8ced6" strokeWidth={0.2} />
            <text x={n(x + 3)} y={n(y + resimH + 8)} fontSize={sigdir(ad, iz.hucreW - 6, 4, 2.8)} fontWeight={700} fontFamily={YAZI.font} fill="#000">{ad}</text>
            {satirlar.map((s, j) => (
              <text key={j} x={n(x + 3)} y={n(y + resimH + 13.5 + j * 4.2)} fontSize={sigdir(s, iz.hucreW - 6, 3, 2.4)} fontFamily={YAZI.font} fill="#333">{s}</text>
            ))}
          </g>
        );
      })}

      {/* Alt bant: iletişim ve sayfa */}
      <line x1={KENAR} y1={k.h - KENAR - ALTBANT + 3} x2={k.w - KENAR} y2={k.h - KENAR - ALTBANT + 3} stroke="#000" strokeWidth={0.3} />
      <text x={KENAR} y={k.h - KENAR - 1} fontSize={3} fontFamily={YAZI.font} fill="#333">{FIRMA.ad}  ·  {FIRMA.tel}  ·  {FIRMA.eposta}  ·  {FIRMA.web}</text>
      <text x={k.w - KENAR} y={k.h - KENAR - 1} textAnchor="end" fontSize={3} fontFamily={YAZI.font} fill="#333">{mt(dp, "kat_sayfa")} {sayfa} / {sayfaSayisi}</text>
    </svg>
  );
}
