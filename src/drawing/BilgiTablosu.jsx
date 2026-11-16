import { CIZGI, YAZI, fmt } from "./iso";
import { sigdir } from "./Antet";
import { TABLO, tabloSutunlari, olcekYaz } from "./sayfaDuzeni";
import { mt, yonMetni } from "./metinler";

/** Üretim özelliği tablosu gösterilecek mi? Yalnız iş emri çiziminde (müşteri çiziminde üretim verisi yok). */
export function uretimVarMi(params) {
  return params.cizimTuru === "ie" && Array.isArray(params.ekOzellikler) && params.ekOzellikler.length > 0 && params.ekGoster !== false;
}

/** Müşteri çiziminin teknik veri satırları: [ad, değer]. (Malzeme/Kaplama yalnız burada, antette tekrar edilmez.) */
export function teknikVeriSatirlari(params, g) {
  return [
    [mt(params, "malzeme"), params.material || "-"],
    [mt(params, "kaplama"), params.coating || "-"],
    [mt(params, "dis_sayisi"), `${params.z}`],
    [mt(params, "helis"), params.helix > 0 ? `${fmt(params.helix)}° ${params.helixHand ? yonMetni(params, params.helixHand) : ""}` : mt(params, "duz")],
    [mt(params, "kesim_yonu"), params.cutDir ? yonMetni(params, params.cutDir) : "-"],
    [mt(params, "kesici_boy"), `${fmt(g.l1)} mm`],
    [mt(params, "cekirdek"), params.dCore > 0 ? `⌀${fmt(params.dCore)} mm` : "-"],
    [mt(params, "sogutma"), params.coolantHole ? `${mt(params, "evet")} (${params.coolantCount})` : mt(params, "yok")],
  ];
}

/**
 * Antetin solundaki tablonun içeriği: müşteri çiziminde TEKNİK VERİ, iş emri çiziminde
 * ÜRETİM ÖZELLİKLERİ (yoksa null). İkisi de aynı ölçüler ve çizimle gelir.
 * @returns {null | {id: string, baslik: string, ogeler: Array<[string,string]>}}
 */
export function tabloIcerigi(params, g) {
  if (params.cizimTuru === "ie") return uretimVarMi(params) ? { id: "uretim-tablosu", baslik: mt(params, "uretim"), ogeler: params.ekOzellikler } : null;
  return { id: "teknik-veri", baslik: mt(params, "teknik_veri"), ogeler: teknikVeriSatirlari(params, g) };
}

/**
 * Bilgi tablosu. Varsayılan yeri antetin solu (sayfa.veriTablosu, sayfa.tablo);
 * sayfa notları gibi ikinci bir tablo için `kutu` ve `yer` verilir.
 */
export function BilgiTablosu({ icerik, sayfa, kutu, yer }) {
  const yr = yer || sayfa.tablo;
  if (!icerik || !yr) return null;
  const { x, y, w, h } = kutu || sayfa.veriTablosu;
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

/**
 * Sayfa notları tablosu (ölçek, birim, genel tolerans): şeritte antet-solundaki tablonun da soluna,
 * çerçevenin sol alt köşesine konur; yer yoksa null. Genel tolerans boşsa satırı yazılmaz.
 * @returns {null | {icerik: object, kutu: object, yer: object}}
 */
export function sayfaNotlari(params, sayfa) {
  const ogeler = [[mt(params, "olcek"), olcekYaz(sayfa.yan.olcek)], [mt(params, "birim"), "mm"]];
  if (String(params.genelTolerans || "").trim()) ogeler.push([mt(params, "genel_tol"), String(params.genelTolerans).trim()]);
  const yer = tabloSutunlari(ogeler.length, sayfa.antet.h);
  const sagSinir = sayfa.veriTablosu.w > 0 ? sayfa.veriTablosu.x : sayfa.antet.x;
  const serbest = sagSinir - sayfa.cerceve.x;
  if (!yer || serbest < yer.w + 4) return null;
  const alt = sayfa.antet.y + sayfa.antet.h;
  return { icerik: { id: "sayfa-notlari", baslik: mt(params, "sayfa"), ogeler }, yer, kutu: { x: sayfa.cerceve.x, y: alt - yer.h, w: yer.w, h: yer.h } };
}
