import { CIZGI, YAZI, fmt } from "./iso";
import { sigdir } from "./Antet";
import { TABLO } from "./sayfaDuzeni";

/** Üretim özelliği tablosu gösterilecek mi? Yalnız iş emri çiziminde (müşteri çiziminde üretim verisi yok). */
export function uretimVarMi(params) {
  return params.cizimTuru === "ie" && Array.isArray(params.ekOzellikler) && params.ekOzellikler.length > 0 && params.ekGoster !== false;
}

/** Müşteri çiziminin teknik veri satırları: [ad, değer]. (Malzeme/Kaplama yalnız burada, antette tekrar edilmez.) */
export function teknikVeriSatirlari(params, g) {
  return [
    ["Malzeme", params.material || "-"],
    ["Kaplama", params.coating || "-"],
    ["Diş sayısı", `${params.z}`],
    ["Helis", params.helix > 0 ? `${fmt(params.helix)}° ${params.helixHand || ""}` : "Düz"],
    ["Kesim yönü", params.cutDir || "-"],
    ["Kesici boy", `${fmt(g.l1)} mm`],
    ["Çekirdek", params.dCore > 0 ? `⌀${fmt(params.dCore)} mm` : "-"],
    ["Soğutma", params.coolantHole ? `Evet (${params.coolantCount})` : "Yok"],
  ];
}

/**
 * Antetin solundaki tablonun içeriği: müşteri çiziminde TEKNİK VERİ, iş emri çiziminde
 * ÜRETİM ÖZELLİKLERİ (yoksa null). İkisi de aynı ölçüler ve çizimle gelir.
 * @returns {null | {id: string, baslik: string, ogeler: Array<[string,string]>}}
 */
export function tabloIcerigi(params, g) {
  if (params.cizimTuru === "ie") return uretimVarMi(params) ? { id: "uretim-tablosu", baslik: "ÜRETİM ÖZELLİKLERİ", ogeler: params.ekOzellikler } : null;
  return { id: "teknik-veri", baslik: "TEKNİK VERİ", ogeler: teknikVeriSatirlari(params, g) };
}

/** Antetin soluna bitişik bilgi tablosu. Yeri ve sütun sayısı sayfa düzeninden gelir (sayfa.veriTablosu, sayfa.tablo). */
export function BilgiTablosu({ icerik, sayfa }) {
  const yr = sayfa.tablo;
  if (!icerik || !yr) return null;
  const { x, y, w, h } = sayfa.veriTablosu;
  const { sutun, satir, satirH } = yr;
  const cw = w / sutun;
  const oge = icerik.ogeler.slice(0, yr.adet);
  const buyuk = satirH >= 5;                                   // seyrek tabloda yazı bir kademe büyük
  const etiketFs = buyuk ? 3.1 : 2.7, degerFs = buyuk ? 3.6 : 3;
  return (
    <g id={icerik.id} fontFamily={YAZI.font}>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />
      <rect x={x} y={y} width={w} height={TABLO.baslikH} fill="#eef1f5" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <text x={x + 2} y={y + TABLO.baslikH - 1.9} fontSize={3.4} fontWeight={700} letterSpacing="0.5" fill="#000">{icerik.baslik}</text>
      {Array.from({ length: sutun - 1 }, (_, i) => (
        <line key={i} x1={x + (i + 1) * cw} y1={y + TABLO.baslikH} x2={x + (i + 1) * cw} y2={y + h} stroke="#000" strokeWidth={CIZGI.ince} />
      ))}
      {oge.map(([ad, deger], i) => {
        const c = Math.floor(i / satir), r = i % satir;          // sütun sütun dolar
        const cx = x + c * cw, cy = y + TABLO.baslikH + r * satirH;
        const azami = Math.floor((cw * 0.5) / (etiketFs * 0.46));
        const etiket = ad.length > azami ? `${ad.slice(0, azami - 1)}…` : ad;
        return (
          <g key={i}>
            {r > 0 && <line x1={cx} y1={cy} x2={cx + cw} y2={cy} stroke="#9aa3ae" strokeWidth={0.2} />}
            <text x={cx + 1.6} y={cy + satirH * 0.7} fontSize={etiketFs} fill="#444">{etiket}</text>
            <text x={cx + cw - 1.4} y={cy + satirH * 0.7} fontSize={sigdir(deger, cw * 0.4, degerFs, 2.4)} fontWeight={700} textAnchor="end" fill="#000">{deger}</text>
          </g>
        );
      })}
    </g>
  );
}
