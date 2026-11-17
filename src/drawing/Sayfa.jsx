import { takimProfili } from "../geometry/profil";
import { sayfaDuzeni, olcekYaz } from "./sayfaDuzeni";
import { Draggable, Surukle } from "./Draggable";
import { YanGorunus } from "./YanGorunus";
import { DetayA } from "./DetayA";
import { Kesit, kesitVarMi } from "./Kesit";
import { UcGorunus } from "./UcGorunus";
import { DisProfili, disProfiliGorunsun } from "./DisProfili";
import { ToleransSembolleri, SALGI_UST_EK } from "./ToleransSembolleri";
import { Antet } from "./Antet";
import { RevizyonTablosu } from "./RevizyonTablosu";
import { Cerceve } from "./Cerceve";
import { BilgiTablosu, tabloIcerigi } from "./BilgiTablosu";
import { YAZI } from "./iso";
import { mt } from "./metinler";

/** Parametrelerden sayfa düzenini hesaplar (Sayfa ve durum çubuğu ortak kullanır). */
export function duzenHesapla(params) {
  const g = takimProfili(params);
  return sayfaDuzeni({
    kagit: params.kagit,
    L: Math.max(g.L, 1),
    D: Math.max(g.D, g.d, 1),
    olcek: params.olcek,
    tur: params.cizimTuru === "ie" ? "ie" : "musteri",
    tabloSayisi: tabloIcerigi(params, g)?.ogeler.length ?? 0,
    ustEk: (String(params.salgi ?? "").trim() ? SALGI_UST_EK : 0) + (g.tip === "stepdrill" && params.kademeOlcu === "toplam" ? 8 : 0),   // salgı çerçevesi / ikinci boy ölçü satırı için takımın üstünde yer aç
    altEk: disProfiliGorunsun(params, g) ? 30 : 0,   // diş profili detayı için takımın altında yer aç
  });
}

const DAMGA_RENK = { ONAYLANDI: "#1b7a2e", TASLAK: "#b08a10", "REVİZYON": "#1565C0", "İPTAL": "#c62828" };

/** A4/A3 resim sayfası: çerçeve, görünüşler, antet, notlar, damga. Birim mm. */
export function Sayfa({ params, dimOff, setDimOff, style, cakisma }) {
  const duzen = duzenHesapla(params);
  const { kagit, cerceve: c, alan, yan, uc } = duzen;
  const olcekMetni = olcekYaz(yan.olcek);
  const ek = { dimOff, setDimOff };
  const notlar = params.notes || [];
  const detayHarfi = kesitVarMi(params, takimProfili(params)) ? "B" : "A";

  return (
    <svg id="teknik-svg" viewBox={`0 0 ${kagit.w} ${kagit.h}`} preserveAspectRatio="xMidYMid meet" style={style}>
      <rect x={0} y={0} width={kagit.w} height={kagit.h} fill="#fff" />
      <Cerceve kagit={kagit} cerceve={c} />

      {/* Görünüşler tutamaçlarından sürüklenebilir: yan görünüş (takım + ölçüleri + detay/kesit işaretleri),
          detay, uçtan görünüş ve kesit görünüşü ayrı ayrı. Konumlar dimOff içinde "g-…" anahtarlarıyla durur. */}
      <Surukle id="g-yan" offsets={dimOff} setOffsets={setDimOff}>
        <YanGorunus params={params} yerlesim={yan} {...ek} />
        <DetayA params={params} yerlesim={yan} bolum="isaret" harf={detayHarfi} {...ek} />
        <Kesit params={params} yan={yan} uc={uc} bolum="duzlem" {...ek} />
      </Surukle>
      <ToleransSembolleri params={params} yerlesim={yan} {...ek} />
      <DetayA params={params} yerlesim={yan} bolum="gorunum" harf={detayHarfi} {...ek} />
      <Kesit params={params} yan={yan} uc={uc} bolum="gorunum" {...ek} />
      <DisProfili params={params} yerlesim={yan} {...ek} />
      <Surukle id="g-uc" offsets={dimOff} setOffsets={setDimOff}>
        <UcGorunus params={params} yerlesim={uc} {...ek} />
      </Surukle>
      <BilgiTablosu icerik={tabloIcerigi(params, takimProfili(params))} sayfa={duzen} />
      <Antet params={params} sayfa={duzen} />
      <RevizyonTablosu params={params} sayfa={duzen} />

      {/* Yazı çakışması işaretleri (yalnız ekranda; dışa aktarmada kaldırılır) */}
      {cakisma && cakisma.length > 0 && (
        <g className="cakisma-isaret" pointerEvents="none">
          {cakisma.map((c, i) => (
            <rect key={i} x={+(c.alan.x - 0.6).toFixed(2)} y={+(c.alan.y - 0.6).toFixed(2)} width={+(c.alan.w + 1.2).toFixed(2)} height={+(c.alan.h + 1.2).toFixed(2)}
              fill="rgba(229,83,75,0.14)" stroke="#e5534b" strokeWidth={0.35} strokeDasharray="1.2 0.8" />
          ))}
        </g>
      )}

      {yan.tasiyor && (
        <text x={alan.x + 3} y={alan.y + 5} fontSize={3} fontFamily={YAZI.font} fill="#c62828">
          {mt(params, "sigmiyor", olcekMetni)}
        </text>
      )}

      {/* Notlar: numaralı balonlar */}
      {notlar.map((note, i) => {
        const nx = alan.x + 12 + i * 24, ny = alan.y + alan.h - 8;
        return (
          <Draggable key={`note-${i}`} id={`note-${i}`} offsets={dimOff} setOffsets={setDimOff}>
            <g fontFamily={YAZI.font}>
              <circle cx={nx} cy={ny} r={3.6} fill="#fff" stroke="#d32f2f" strokeWidth={0.4} />
              <text x={nx} y={ny + 1.2} textAnchor="middle" fontSize={3.6} fill="#d32f2f" fontWeight="700">{i + 1}</text>
              <line x1={nx + 3.6} y1={ny} x2={nx + 8} y2={ny - 3} stroke="#d32f2f" strokeWidth={0.25} />
              <text x={nx + 8.6} y={ny - 3} fontSize={3} fill="#d32f2f">{note.text}</text>
            </g>
          </Draggable>
        );
      })}

      {/* Onay damgası */}
      {params.stamp && (() => {
        const col = DAMGA_RENK[params.stamp] || "#333";
        const cx = alan.x + 38, cy = alan.y + 18;          // sol üst köşe: alt bölge diş profili detayı ve notlarla paylaşılıyor
        const tarih = params.stampDate ? params.stampDate.split("-").reverse().join(".") : new Date().toLocaleDateString("tr-TR");
        return (
          <Draggable id="damga" offsets={dimOff} setOffsets={setDimOff}>
          <g transform={`rotate(-12 ${cx} ${cy})`} opacity={0.8} fontFamily={YAZI.font}>
            <rect x={cx - 24} y={cy - 8} width={48} height={16} rx={1.5} fill="none" stroke={col} strokeWidth={0.7} strokeDasharray="1.8 0.8" />
            <rect x={cx - 22.8} y={cy - 6.8} width={45.6} height={13.6} rx={1} fill="none" stroke={col} strokeWidth={0.3} />
            <text x={cx} y={cy + 1} textAnchor="middle" fontSize={5.2} fontWeight="800" fill={col} letterSpacing="0.6">{mt(params, params.stamp)}</text>
            <text x={cx} y={cy + 5.2} textAnchor="middle" fontSize={2.2} fill={col}>{tarih}</text>
          </g>
          </Draggable>
        );
      })()}
    </svg>
  );
}
