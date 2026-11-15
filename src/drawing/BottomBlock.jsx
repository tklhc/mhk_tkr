import { LOGO_IMG } from "../assets/images";

// ─── UNIFIED BOTTOM BLOCK (Numroto-style) ──────────────

function BottomBlock({ params, x, y, w, scaleText }) {
  const f = "'JetBrains Mono','IBM Plex Mono', monospace";
  const h = 90;

  // Sabit kişi bilgileri
  const CIZEN   = "Mehmet Taha KÜLAHCI";
  const TEL     = "0507 321 62 80";
  const EPOSTA  = "taha@mihenk.net";
  const WEB     = "www.mihenkkesicitakimlar.com";

  // Kolon genişlikleri: params'dan
  const pW  = w * (params.bbCol1 / 100);
  const fW  = w * (params.bbCol2 / 100);
  const aW  = w - pW - fW;

  const pX = x;
  const fX = x + pW;
  const aX = fX + fW;

  // Sol param tablosu
  const rows = [
    ["Diş Sayısı",    `${params.z}`],
    ["Helis Açısı",   `${params.helix}°`],
    ["Helis Yönü",    params.helixHand],
    ["Kesim Yönü",    params.cutDir],
    ["Kesici Boy",    `${params.l1} mm`],
    ["Malzeme",       params.material],
    ["Soğutma",       params.coolantHole ? `Evet (${params.coolantCount})` : "Yok"],
  ];
  const rH = h / rows.length;
  const lW = pW * 0.56;

  const LN = (x1,y1,x2,y2,sw=0.3,col="#b0b8c0") => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={sw}/>;

  return (
    <g fontFamily={f}>
      {/* ── Dış çerçeve — kalın ── */}
      <rect x={x} y={y} width={w} height={h} fill="#f8f9fb" stroke="#222" strokeWidth={1.4}/>

      {/* ══ Dikey ana bölücüler ══ */}
      {LN(fX, y, fX, y+h, 1.0, "#333")}
      {LN(aX, y, aX, y+h, 1.0, "#333")}

      {/* ════ KOL 1: Parametre Tablosu ════ */}
      {rows.map((r, i) => {
        const rowY = y + i * rH;
        const isEven = i % 2 === 0;
        return (
          <g key={i}>
            {/* Alternating row background */}
            {isEven && <rect x={pX + 0.5} y={rowY + 0.3} width={pW - 1} height={rH - 0.3} fill="#f0f3f7" />}
            {/* Row separator */}
            {i > 0 && LN(pX, rowY, fX, rowY, 0.3, "#c8d0d8")}
            {/* Column separator */}
            {LN(pX + lW, rowY + 0.5, pX + lW, rowY + rH - 0.5, 0.2, "#d0d8e0")}
            {/* Label */}
            <text x={pX + 2} y={rowY + rH * 0.68} fontSize={4.0} fill="#2a3a4a" fontWeight="700">{r[0]}</text>
            {/* Value */}
            <text x={pX + lW + 2} y={rowY + rH * 0.68} fontSize={4.5} fill="#0a0a0a" fontWeight="800">{r[1]}</text>
          </g>
        );
      })}

      {/* ════ KOL 2: Firma / Logo + Kişi Bilgileri ════ */}
      {/* Logo area */}
      <rect x={fX + 0.5} y={y + 0.5} width={fW - 1} height={h * 0.38} fill="#fafbfc" />
      <image href={LOGO_IMG} x={fX + 8} y={y + 4} width={fW - 16} height={h * 0.34} preserveAspectRatio="xMidYMid meet"/>
      {LN(fX, y + h * 0.40, aX, y + h * 0.40, 0.5, "#aab5c0")}

      {/* Çizen bilgisi */}
      <rect x={fX + 0.5} y={y + h * 0.40 + 0.3} width={fW - 1} height={h * 0.22} fill="#edf1f6" />
      <text x={fX + 5} y={y + h * 0.40 + 7} fontSize={3.8} fill="#5a6a7a" fontWeight="600">Çizen:</text>
      <text x={fX + 5} y={y + h * 0.40 + 15} fontSize={5.0} fill="#0a1020" fontWeight="800">{CIZEN}</text>
      {LN(fX, y + h * 0.62, aX, y + h * 0.62, 0.3, "#c0c8d0")}

      {/* İletişim — müşteri modunda gizle */}
      {!params.customerMode && (<>
        <text x={fX + 5} y={y + h * 0.62 + 7} fontSize={3.8} fill="#3a4a5a" fontWeight="600">Tel:</text>
        <text x={fX + 20} y={y + h * 0.62 + 7} fontSize={4.0} fill="#1a2a3a" fontWeight="700">{TEL}</text>
        {LN(fX, y + h * 0.74, aX, y + h * 0.74, 0.2, "#d0d8e0")}
        <text x={fX + 5} y={y + h * 0.74 + 7} fontSize={3.6} fill="#3a4a5a" fontWeight="600">{EPOSTA}</text>
        {LN(fX, y + h * 0.86, aX, y + h * 0.86, 0.2, "#d0d8e0")}
        <text x={fX + 5} y={y + h * 0.86 + 7} fontSize={3.4} fill="#3a4a5a" fontWeight="600">{WEB}</text>
      </>)}
      {params.customerMode && (<>
        <text x={fX + fW / 2} y={y + h * 0.72} textAnchor="middle" fontSize={4.5} fill="#3a5a7a" fontWeight="700" letterSpacing="1">MİHENK KESİCİ TAKIMLAR</text>
        <text x={fX + fW / 2} y={y + h * 0.82} textAnchor="middle" fontSize={3.2} fill="#6a8aaa" fontWeight="500">San. Tic. Ltd. Şti.</text>
      </>)}

      {/* ════ KOL 3: Alet Adı + Kaplama ════ */}
      {/* Alet adı bölümü */}
      <rect x={aX + 0.5} y={y + 0.5} width={aW - 1} height={h * 0.50 - 0.5} fill="#eaf0f8"/>
      <text x={aX + 6} y={y + 9} fontSize={4.2} fill="#4a6080" fontWeight="700" letterSpacing="1.5">ALET ADI</text>
      {(() => {
        const name = params.toolName || "";
        const fs = name.length > 28 ? 6.5 : name.length > 20 ? 8.0 : name.length > 14 ? 9.5 : 11;
        return <text x={aX + 6} y={y + 30} fontSize={fs} fill="#0a1525" fontWeight="900">{name}</text>;
      })()}
      {LN(aX, y + h * 0.50, x + w, y + h * 0.50, 0.6, "#8a9ab0")}

      {/* Kaplama bölümü */}
      <text x={aX + 6} y={y + h * 0.50 + 9} fontSize={4.2} fill="#4a6080" fontWeight="700" letterSpacing="1.5">KAPLAMA</text>
      <text x={aX + 6} y={y + h * 0.50 + 22} fontSize={9.5} fill="#0a1525" fontWeight="900">{params.coating || "—"}</text>

      {/* Müşteri / Sipariş bilgisi (varsa) */}
      {(params.customerName || params.orderNo) && (<>
        {LN(aX, y + h * 0.72, x + w, y + h * 0.72, 0.3, "#b0b8c0")}
        {params.customerName && <text x={aX + 6} y={y + h * 0.72 + 6} fontSize={3.2} fill="#4a6080" fontWeight="600">Müşteri: <tspan fill="#0a1525" fontWeight="800">{params.customerName}</tspan></text>}
        {params.orderNo && <text x={aX + 6} y={y + h * 0.72 + 12} fontSize={3.2} fill="#4a6080" fontWeight="600">Sipariş: <tspan fill="#0a1525" fontWeight="800">{params.orderNo}</tspan></text>}
        {params.deliveryDate && <text x={aX + 6} y={y + h * 0.72 + 18} fontSize={3} fill="#4a6080" fontWeight="600">Teslim: <tspan fill="#0a1525" fontWeight="700">{params.deliveryDate}</tspan></text>}
      </>)}

      {/* Mini QR Tanımlayıcı */}
      {(() => {
        const qx = x + w - 20, qy = y + h - 20, qs = 18;
        const str = (params.toolName || "") + (params.orderNo || "");
        if (!str) return null;
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
        const cells = [];
        const grid = 7;
        const cs = qs / grid;
        for (let gy = 0; gy < grid; gy++) {
          for (let gx = 0; gx < grid; gx++) {
            // Corner finder patterns
            const isCorner = (gx < 3 && gy < 3) || (gx >= grid - 3 && gy < 3) || (gx < 3 && gy >= grid - 3);
            const isBorder = isCorner && (gx === 0 || gx === 2 || gx === grid-1 || gx === grid-3 || gy === 0 || gy === 2 || gy === grid-1 || gy === grid-3);
            const isCenter = isCorner && gx % 2 === 1 && gy % 2 === 1;
            const bit = (hash >> ((gy * grid + gx) % 31)) & 1;
            const on = isCorner ? (isBorder || isCenter) : bit;
            if (on) cells.push(<rect key={`q${gy}-${gx}`} x={qx + gx * cs} y={qy + gy * cs} width={cs - 0.2} height={cs - 0.2} fill="#1a1a2a" />);
          }
        }
        return <g><rect x={qx - 1} y={qy - 1} width={qs + 2} height={qs + 2} fill="#fff" stroke="#ddd" strokeWidth={0.3} rx={0.5} />{cells}</g>;
      })()}

    </g>
  );
}

export { BottomBlock };
