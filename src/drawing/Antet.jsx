import qrcode from "qrcode-generator";
import { takimProfili } from "../geometry/profil";
import { FIRMA } from "../config";
import { LOGO_IMG } from "../assets/images";
import { CIZGI, YAZI, fmt } from "./iso";

const ince = CIZGI.ince, kalin = CIZGI.kalin;
const kes = (s, n) => (String(s ?? "").length > n ? String(s).slice(0, n - 1) + "…" : String(s ?? ""));

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

function Hucre({ x, y, w, h, etiket, deger, boyut = 3.4, kalinYazi = false, hizala = "start" }) {
  const tx = hizala === "middle" ? x + w / 2 : x + 1.2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" strokeWidth={ince} />
      <text x={tx} y={y + 2.7} fontSize={1.8} fontFamily={YAZI.font} fill="#555" textAnchor={hizala}>{etiket}</text>
      <text x={tx} y={y + h - 2.6} fontSize={boyut} fontFamily={YAZI.font} fill="#000" fontWeight={kalinYazi ? 700 : 400} textAnchor={hizala}>{deger}</text>
    </g>
  );
}

/** ISO 7200 antet + sol yanda teknik veri tablosu. */
export function Antet({ params, sayfa, olcekMetni }) {
  const { antet: a, veriTablosu: v } = sayfa;
  const g = takimProfili(params);
  const kalan = params.customerMode;
  const sol = 44;           // sol sütun: logo + firma
  const rx = a.x + sol, rw = a.w - sol;
  const rh = a.h / 3;
  const ad = params.toolName || "";
  const adBoyut = Math.min(7, 70 / Math.max(ad.length * 0.52, 1));
  const qrMetin = `MHK|${ad}|${params.drawingNo || "-"}|${params.revision || "-"}`;
  const lines = [];
  if (!kalan) lines.push(FIRMA.tel, FIRMA.eposta, FIRMA.web);
  if (params.customerName) lines.push(`Müşteri: ${kes(params.customerName, 26)}`);
  if (params.orderNo) lines.push(`Sipariş: ${kes(params.orderNo, 26)}`);
  if (params.deliveryDate) lines.push(`Teslim: ${tarihYaz(params.deliveryDate)}`);

  // Teknik veri tablosu
  const satirlar = [
    ["Diş sayısı", `${params.z}`],
    ["Helis", `${fmt(params.helix)}° ${params.helixHand || ""}`],
    ["Kesim yönü", params.cutDir || ""],
    ["Kesici boy", `${fmt(g.l1)} mm`],
    ["Çekirdek", params.dCore > 0 ? `⌀${fmt(params.dCore)}` : "-"],
    ["Malzeme", params.material || ""],
    ["Kaplama", params.coating || "-"],
    ["Soğutma", params.coolantHole ? `Evet (${params.coolantCount})` : "Yok"],
  ];
  const bas = 5.2; // başlık yüksekliği
  const sh = (v.h - bas) / satirlar.length;
  const lw = v.w * 0.42;

  return (
    <g fontFamily={YAZI.font}>
      {/* Teknik veri tablosu */}
      <rect x={v.x} y={v.y} width={v.w} height={v.h} fill="none" stroke="#000" strokeWidth={kalin} />
      <text x={v.x + 1.5} y={v.y + 3.7} fontSize={2.6} fontWeight={700} fill="#000">TEKNİK VERİ</text>
      <line x1={v.x} y1={v.y + bas} x2={v.x + v.w} y2={v.y + bas} stroke="#000" strokeWidth={ince} />
      <line x1={v.x + lw} y1={v.y + bas} x2={v.x + lw} y2={v.y + v.h} stroke="#000" strokeWidth={ince} />
      {satirlar.map(([k, val], i) => {
        const yy = v.y + bas + i * sh;
        return (
          <g key={k}>
            {i > 0 && <line x1={v.x} y1={yy} x2={v.x + v.w} y2={yy} stroke="#000" strokeWidth={ince} />}
            <text x={v.x + 1.5} y={yy + sh * 0.7} fontSize={2.5} fill="#444">{k}</text>
            <text x={v.x + lw + 1.5} y={yy + sh * 0.7} fontSize={2.8} fontWeight={600} fill="#000">{kes(val, 30)}</text>
          </g>
        );
      })}

      {/* Antet çerçevesi */}
      <rect x={a.x} y={a.y} width={a.w} height={a.h} fill="none" stroke="#000" strokeWidth={kalin} />
      <line x1={rx} y1={a.y} x2={rx} y2={a.y + a.h} stroke="#000" strokeWidth={ince} />

      {/* Sol sütun: logo + firma + iletişim */}
      <image href={LOGO_IMG} x={a.x + 4} y={a.y + 3} width={sol - 8} height={13} preserveAspectRatio="xMidYMid meet" />
      <text x={a.x + sol / 2} y={a.y + 20.5} fontSize={2.3} fontWeight={700} textAnchor="middle" fill="#000">{FIRMA.ad}</text>
      {lines.map((t, i) => (
        <text key={i} x={a.x + 2} y={a.y + 25.5 + i * 3.1} fontSize={2.2} fill="#222">{t}</text>
      ))}

      {/* Sağ alan: 3 satır */}
      <Hucre x={rx} y={a.y} w={76} h={rh} etiket="ALET ADI / TAKIM" deger={ad} boyut={adBoyut} kalinYazi />
      <Hucre x={rx + 76} y={a.y} w={34} h={rh} etiket="ÇİZİM NO" deger={params.drawingNo || "-"} kalinYazi />
      <Hucre x={rx + 110} y={a.y} w={rw - 110} h={rh} etiket="REV." deger={params.revision || "-"} kalinYazi />

      <Hucre x={rx} y={a.y + rh} w={34} h={rh} etiket="MALZEME" deger={kes(params.material, 14)} />
      <Hucre x={rx + 34} y={a.y + rh} w={34} h={rh} etiket="KAPLAMA" deger={kes(params.coating || "-", 14)} />
      <Hucre x={rx + 68} y={a.y + rh} w={22} h={rh} etiket="ÖLÇEK" deger={olcekMetni} kalinYazi />
      <Hucre x={rx + 90} y={a.y + rh} w={18} h={rh} etiket="KAĞIT" deger={sayfa.kagit.ad} />
      <Hucre x={rx + 108} y={a.y + rh} w={rw - 108} h={rh} etiket="TARİH" deger={tarihYaz(params.tarih)} />

      <Hucre x={rx} y={a.y + 2 * rh} w={38} h={rh} etiket="ÇİZEN" deger={kes(params.createdBy || FIRMA.cizen, 20)} />
      <Hucre x={rx + 38} y={a.y + 2 * rh} w={38} h={rh} etiket="ONAYLAYAN" deger={kes(params.approvedBy, 20)} />
      <Hucre x={rx + 76} y={a.y + 2 * rh} w={38} h={rh} etiket="GENEL TOLERANS" deger={kes(params.genelTolerans, 16)} />
      <rect x={rx + 114} y={a.y + 2 * rh} width={rw - 114} height={rh} fill="none" stroke="#000" strokeWidth={ince} />
      <QR x={rx + 114 + (rw - 114 - 12.4) / 2} y={a.y + 2 * rh + 0.8} boyut={12.4} metin={qrMetin} />
    </g>
  );
}
