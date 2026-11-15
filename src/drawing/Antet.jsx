import qrcode from "qrcode-generator";
import { FIRMA } from "../config";
import { LOGO_IMG } from "../assets/images";
import { CIZGI, YAZI } from "./iso";

const ince = CIZGI.ince, kalin = CIZGI.kalin;

/** Metin, hücreye sığacak en büyük yazı boyutu (mm); azami boyutu aşmaz. */
export const sigdir = (metin, genislik, azami, asgari = 2.6) => {
  const n = Math.max(String(metin ?? "").length, 1);
  return Math.max(asgari, Math.min(azami, genislik / (n * 0.5)));
};

/** "2026-11-15" → "15.11.2026"; boşsa bugün */
export function tarihYaz(iso, simdi = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return simdi.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Gerçek QR: modül başına bir kare, tek path. */
function QR({ x, y, boyut, metin }) {
  const qr = qrcode(0, "L");
  qr.addData(metin);
  qr.make();
  const m = qr.getModuleCount();
  const hucre = boyut / (m + 2); // 1 modül sessiz bölge
  let d = "";
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      if (qr.isDark(r, c)) d += `M${+(x + (c + 1) * hucre).toFixed(3)} ${+(y + (r + 1) * hucre).toFixed(3)}h${+hucre.toFixed(3)}v${+hucre.toFixed(3)}h${-+hucre.toFixed(3)}z`;
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={boyut} height={boyut} fill="#fff" />
      <path d={d} fill="#000" />
    </g>
  );
}

// Yazı boyutları (mm): etiket küçük gri, değer büyük. En küçük yazı 2,4 mm.
const ETIKET = 2.4;

function Hucre({ x, y, w, h, etiket, deger, boyut = 4.6, kalinYazi = false }) {
  const metin = String(deger ?? "");
  const fs = sigdir(metin, w - 3, boyut);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" strokeWidth={ince} />
      <text x={x + 1.5} y={y + 3.4} fontSize={ETIKET} fontFamily={YAZI.font} fill="#555" letterSpacing="0.15">{etiket}</text>
      <text x={x + 1.5} y={y + h - 2.8} fontSize={fs} fontFamily={YAZI.font} fill="#000" fontWeight={kalinYazi ? 700 : 500}>{metin}</text>
    </g>
  );
}

/**
 * ISO 7200 antet (sağ altta). İki çizim türünde de aynı ölçü ve düzen; solundaki bilgi tablosunu
 * (TEKNİK VERİ ya da ÜRETİM ÖZELLİKLERİ) BilgiTablosu çizer.
 */
export function Antet({ params, sayfa }) {
  const { antet: a } = sayfa;
  const sol = 44;                      // sol sütun: logo ve firma adı
  const rx = a.x + sol, rw = a.w - sol;
  const h1 = 17, h2 = (a.h - h1) / 2;  // 3 satır: ad satırı biraz yüksek
  const qrW = 24, qrBoyut = 21;
  const ad = params.toolName || "";
  const qrMetin = `MHK|${ad}|${params.drawingNo || "-"}|${params.revision || "-"}`;
  const sagGenislik = rw - qrW;        // 2. ve 3. satırlarda QR hücresi sağda
  const logoW = sol - 8, logoH = 19;
  const firmaFs = sigdir(FIRMA.ad, sol - 6, 3.5, 2.4) * 0.86; // dar sütunda firma adı sığsın

  return (
    <g fontFamily={YAZI.font}>
      {/* ── Antet çerçevesi ── */}
      <rect x={a.x} y={a.y} width={a.w} height={a.h} fill="none" stroke="#000" strokeWidth={kalin} />
      <line x1={rx} y1={a.y} x2={rx} y2={a.y + a.h} stroke="#000" strokeWidth={kalin * 0.7} />

      {/* Sol sütun: logo ve firma adı */}
      <image href={LOGO_IMG} x={a.x + (sol - logoW) / 2} y={a.y + 7} width={logoW} height={logoH} preserveAspectRatio="xMidYMid meet" />
      <text x={a.x + sol / 2} y={a.y + 35} fontSize={firmaFs} fontWeight={700} textAnchor="middle" fill="#000" letterSpacing="0.3">{FIRMA.ad}</text>

      {/* Sağ alan: ALET ADI / ÇİZİM NO / REV; TARİH / MÜŞTERİ / İE NO; ÇİZEN / ONAYLAYAN */}
      <Hucre x={rx} y={a.y} w={60} h={h1} etiket="ALET ADI" deger={ad} boyut={9} kalinYazi />
      <Hucre x={rx + 60} y={a.y} w={20} h={h1} etiket="ÇİZİM NO" deger={params.drawingNo || "-"} boyut={6} kalinYazi />
      <Hucre x={rx + 80} y={a.y} w={rw - 80} h={h1} etiket="REV." deger={params.revision || "-"} boyut={6} kalinYazi />

      <Hucre x={rx} y={a.y + h1} w={23} h={h2} etiket="TARİH" deger={tarihYaz(params.tarih)} boyut={4.6} />
      <Hucre x={rx + 23} y={a.y + h1} w={sagGenislik - 23 - 21} h={h2} etiket="MÜŞTERİ" deger={params.customerName || "-"} boyut={4.6} />
      <Hucre x={rx + sagGenislik - 21} y={a.y + h1} w={21} h={h2} etiket="İE / SİP. NO" deger={params.orderNo || "-"} boyut={4.6} />

      <Hucre x={rx} y={a.y + h1 + h2} w={sagGenislik / 2} h={h2} etiket="ÇİZEN" deger={params.createdBy || FIRMA.cizen} boyut={4.6} />
      <Hucre x={rx + sagGenislik / 2} y={a.y + h1 + h2} w={sagGenislik / 2} h={h2} etiket="ONAYLAYAN" deger={params.approvedBy || ""} boyut={4.6} />

      {/* QR: 2. ve 3. satırı kaplar */}
      <rect x={rx + sagGenislik} y={a.y + h1} width={qrW} height={2 * h2} fill="none" stroke="#000" strokeWidth={ince} />
      <QR x={rx + sagGenislik + (qrW - qrBoyut) / 2} y={a.y + h1 + (2 * h2 - qrBoyut) / 2} boyut={qrBoyut} metin={qrMetin} />
    </g>
  );
}
