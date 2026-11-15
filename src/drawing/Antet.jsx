import qrcode from "qrcode-generator";
import { takimProfili } from "../geometry/profil";
import { FIRMA } from "../config";
import { LOGO_IMG } from "../assets/images";
import { CIZGI, YAZI, fmt } from "./iso";

const ince = CIZGI.ince, kalin = CIZGI.kalin;
const kes = (s, n) => (String(s ?? "").length > n ? String(s).slice(0, n - 1) + "…" : String(s ?? ""));

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

/** ISO 7200 antet (sağ altta) + solunda teknik veri tablosu. */
export function Antet({ params, sayfa, olcekMetni }) {
  const { antet: a, veriTablosu: v } = sayfa;
  const g = takimProfili(params);
  const kalan = params.customerMode;
  const sol = 46;                      // sol sütun: logo, firma, iletişim
  const rx = a.x + sol, rw = a.w - sol;
  const h1 = 17, h2 = (a.h - h1) / 2;  // 3 satır: ad satırı biraz yüksek
  const qrW = 26;
  const ad = params.toolName || "";
  const qrMetin = `MHK|${ad}|${params.drawingNo || "-"}|${params.revision || "-"}`;
  const sagGenislik = rw - qrW;        // 2. ve 3. satırlarda QR hücresi sağda

  const iletisim = kalan ? [] : [FIRMA.tel, FIRMA.eposta, FIRMA.web];
  const musteri = [];
  if (params.customerName) musteri.push(`Müşteri: ${kes(params.customerName, 24)}`);
  if (params.orderNo) musteri.push(`Sipariş: ${kes(params.orderNo, 24)}`);
  if (params.deliveryDate) musteri.push(`Teslim: ${tarihYaz(params.deliveryDate)}`);

  // Teknik veri tablosu (Malzeme/Kaplama yalnız burada; antette tekrar edilmez)
  const satirlar = [
    ["Malzeme", params.material || "-"],
    ["Kaplama", params.coating || "-"],
    ["Diş sayısı", `${params.z}`],
    ["Helis", params.helix > 0 ? `${fmt(params.helix)}° ${params.helixHand || ""}` : "Düz"],
    ["Kesim yönü", params.cutDir || "-"],
    ["Kesici boy", `${fmt(g.l1)} mm`],
    ["Çekirdek", params.dCore > 0 ? `⌀${fmt(params.dCore)} mm` : "-"],
    ["Soğutma", params.coolantHole ? `Evet (${params.coolantCount})` : "Yok"],
  ];
  const bas = 6.4;
  const sh = (v.h - bas) / satirlar.length;
  const lw = v.w * 0.4;

  return (
    <g fontFamily={YAZI.font}>
      {/* ── Teknik veri tablosu ── */}
      <rect x={v.x} y={v.y} width={v.w} height={v.h} fill="none" stroke="#000" strokeWidth={kalin} />
      <rect x={v.x} y={v.y} width={v.w} height={bas} fill="#eef1f5" stroke="#000" strokeWidth={ince} />
      <text x={v.x + 2} y={v.y + bas - 1.9} fontSize={3.4} fontWeight={700} fill="#000" letterSpacing="0.6">TEKNİK VERİ</text>
      <line x1={v.x + lw} y1={v.y + bas} x2={v.x + lw} y2={v.y + v.h} stroke="#000" strokeWidth={ince} />
      {satirlar.map(([k, val], i) => {
        const yy = v.y + bas + i * sh;
        const fs = sigdir(val, v.w - lw - 3, 3.7, 3);
        return (
          <g key={k}>
            {i > 0 && <line x1={v.x} y1={yy} x2={v.x + v.w} y2={yy} stroke="#9aa3ae" strokeWidth={0.2} />}
            <text x={v.x + 2} y={yy + sh * 0.7} fontSize={3.1} fill="#444">{k}</text>
            <text x={v.x + lw + 2} y={yy + sh * 0.7} fontSize={fs} fontWeight={700} fill="#000">{val}</text>
          </g>
        );
      })}

      {/* ── Antet çerçevesi ── */}
      <rect x={a.x} y={a.y} width={a.w} height={a.h} fill="none" stroke="#000" strokeWidth={kalin} />
      <line x1={rx} y1={a.y} x2={rx} y2={a.y + a.h} stroke="#000" strokeWidth={kalin * 0.7} />

      {/* Sol sütun: logo + firma + iletişim / müşteri */}
      <image href={LOGO_IMG} x={a.x + 5} y={a.y + 3} width={sol - 10} height={15} preserveAspectRatio="xMidYMid meet" />
      <text x={a.x + sol / 2} y={a.y + 22.6} fontSize={2.9} fontWeight={700} textAnchor="middle" fill="#000" letterSpacing="0.2">{FIRMA.ad}</text>
      <line x1={a.x + 3} y1={a.y + 25} x2={a.x + sol - 3} y2={a.y + 25} stroke="#9aa3ae" strokeWidth={0.2} />
      {iletisim.map((t, i) => (
        <text key={t} x={a.x + 3} y={a.y + 29.4 + i * 3.7} fontSize={2.7} fill="#222">{t}</text>
      ))}
      {musteri.map((t, i) => (
        <text key={t} x={a.x + 3} y={a.y + a.h - 3 - (musteri.length - 1 - i) * 3.7} fontSize={2.9} fontWeight={i === 0 ? 700 : 500} fill="#000">{t}</text>
      ))}

      {/* Sağ alan */}
      <Hucre x={rx} y={a.y} w={78} h={h1} etiket="ALET ADI" deger={ad} boyut={9} kalinYazi />
      <Hucre x={rx + 78} y={a.y} w={34} h={h1} etiket="ÇİZİM NO" deger={params.drawingNo || "-"} boyut={6} kalinYazi />
      <Hucre x={rx + 112} y={a.y} w={rw - 112} h={h1} etiket="REV." deger={params.revision || "-"} boyut={6} kalinYazi />

      <Hucre x={rx} y={a.y + h1} w={30} h={h2} etiket="ÖLÇEK" deger={olcekMetni} boyut={5.4} kalinYazi />
      <Hucre x={rx + 30} y={a.y + h1} w={24} h={h2} etiket="KAĞIT" deger={sayfa.kagit.ad} boyut={5.4} />
      <Hucre x={rx + 54} y={a.y + h1} w={sagGenislik - 54} h={h2} etiket="TARİH" deger={tarihYaz(params.tarih)} boyut={5.4} />

      <Hucre x={rx} y={a.y + h1 + h2} w={36} h={h2} etiket="ÇİZEN" deger={params.createdBy || FIRMA.cizen} boyut={4.6} />
      <Hucre x={rx + 36} y={a.y + h1 + h2} w={36} h={h2} etiket="ONAYLAYAN" deger={params.approvedBy || ""} boyut={4.6} />
      <Hucre x={rx + 72} y={a.y + h1 + h2} w={sagGenislik - 72} h={h2} etiket="GENEL TOLERANS" deger={params.genelTolerans || ""} boyut={4.6} />

      {/* QR: 2. ve 3. satırı kaplar */}
      <rect x={rx + sagGenislik} y={a.y + h1} width={qrW} height={2 * h2} fill="none" stroke="#000" strokeWidth={ince} />
      <QR x={rx + sagGenislik + (qrW - 23) / 2} y={a.y + h1 + (2 * h2 - 23) / 2} boyut={23} metin={qrMetin} />
    </g>
  );
}
