import { useCallback, useMemo, useState } from "react";
import { TOOL_TYPES } from "../constants";
import { tipDegistir } from "../geometry/tipler";
import { takimProfili } from "../geometry/profil";
import { OLCEKLER, olcekYaz } from "../drawing/sayfaDuzeni";
import { pngBlobu } from "../io/export";
import { LOGO_IMG } from "../assets/images";
import { Sayi, SayiKutu, Metin, Secim, Anahtar, Cip, Grup, Ek } from "./inputs";
import { LibraryPanel } from "./LibraryPanel";

const SEKMELER = [["takim", "Takım"], ["resim", "Resim"], ["belge", "Belge"], ["kutuphane", "Kütüphane"]];

const GOSTER = [
  ["showDimD", "⌀D"], ["showDimd", "⌀d"], ["showDimL", "L"], ["showDiml1", "l₁"], ["showDiml2", "l₂"],
  ["showDimNeck", "⌀ Boğaz"], ["showDimHelix", "Helis açısı"], ["showDimAngles", "Açı / R / pah"],
  ["kesitAA", "Kesit A-A"], ["detayA", "Uç detayı"],
];

const DAMGALAR = [
  ["", "Yok", ""], ["ONAYLANDI", "Onaylandı", "damga-onay"], ["TASLAK", "Taslak", ""], ["REVİZYON", "Revizyon", ""], ["İPTAL", "İptal", "damga-iptal"],
];

/** Resmi PNG olarak paylaşır; Web Share yoksa WhatsApp / e-posta bağlantısına düşer. */
async function paylas(params, tur) {
  const svg = document.getElementById("teknik-svg");
  if (!svg) return;
  const ad = params.toolName || "teknik-resim";
  try {
    const blob = await pngBlobu(svg, 6);
    const dosya = new File([blob], `${ad}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
      await navigator.share({ title: `${ad} - Teknik Resim`, text: `MİHENK Kesici Takımlar - ${ad}`, files: [dosya] });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  const baslik = `${ad} - MİHENK Teknik Resim`;
  window.open(tur === "wa"
    ? `https://wa.me/?text=${encodeURIComponent(baslik)}`
    : `mailto:?subject=${encodeURIComponent(baslik)}&body=${encodeURIComponent("Teknik resim ektedir.")}`, "_blank");
}

function Panel({ params, setParams, isMobile, showPanel, onClose, onYeni }) {
  const [sekme, setSekme] = useState("takim");
  const u = useCallback((k, v) => setParams((p) => ({ ...p, [k]: v })), [setParams]);
  const hatalar = useMemo(() => takimProfili(params).hatalar, [params]);
  const hata = useMemo(() => Object.fromEntries(hatalar.map((h) => [h.alan, h.mesaj])), [hatalar]);
  const tip = params.toolType;
  const kademeli = tip === "stepdrill";
  const adimGuncelle = (i, alan, v) => setParams((p) => ({ ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, [alan]: v } : s)) }));
  const sapOzel = params.sapTipi && params.sapTipi !== "HA";

  return (
    <aside className={`panel${isMobile && !showPanel ? " kapali" : ""}`} aria-label="Takım ayarları">
      <div className="panel-ust">
        <img src={LOGO_IMG} alt="MİHENK" />
        <div className="baslik"><b>Teknik Resim</b><span>Kesici takım çizim sistemi</span></div>
        <button className="btn kucuk" title="Boş bir takımla yeni resim başlat (taslak otomatik kaydedilir)" onClick={onYeni}>+ Yeni</button>
        {isMobile && <button className="btn kucuk ikon" onClick={onClose} aria-label="Paneli kapat">✕</button>}
      </div>

      <div className="sekmeler" role="tablist">
        {SEKMELER.map(([k, ad]) => (
          <button key={k} role="tab" aria-selected={sekme === k} className={`sekme${sekme === k ? " acik" : ""}`} onClick={() => setSekme(k)}>
            {ad}
            {k === "takim" && hatalar.length > 0 && <span className="rozet" title={`${hatalar.length} geometri uyarısı`}>{hatalar.length}</span>}
          </button>
        ))}
      </div>

      <div className="panel-govde">
        {/* ═════════ TAKIM ═════════ */}
        {sekme === "takim" && <>
          {hatalar.length > 0 && (
            <div className="uyari" role="alert">{hatalar.map((h, i) => <div key={i}>⚠ {h.mesaj}</div>)}</div>
          )}

          <select className="secim tip-secici" aria-label="Takım tipi" value={tip}
            onChange={(e) => { const v = e.target.value; setParams((p) => tipDegistir(p, v)); }}>
            {Object.entries(TOOL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <Grup baslik="Ana ölçüler" sag="değer · tolerans">
            {!kademeli && <Sayi label="Kesici çap  D" value={params.D} onChange={(v) => u("D", v)} step={0.5} hata={hata.D} tol={params.tolD} onTol={(v) => u("tolD", v)} />}
            <Sayi label="Sap çapı  d" value={params.d} onChange={(v) => u("d", v)} step={0.5} hata={hata.d} tol={params.told} onTol={(v) => u("told", v)} />
            <Sayi label="Toplam boy  L" value={params.L} onChange={(v) => u("L", v)} hata={hata.L} tol={params.tolL} onTol={(v) => u("tolL", v)} />
            {!kademeli && <Sayi label="Kesici boy  l₁" value={params.l1} onChange={(v) => u("l1", v)} step={0.5} hata={hata.l1} tol={params.toll1} onTol={(v) => u("toll1", v)} />}
            {!kademeli && <Sayi label="Boğaz boyu  l₂" value={params.l2} onChange={(v) => u("l2", v)} step={0.5} tol={params.toll2} onTol={(v) => u("toll2", v)} />}
            {!kademeli && params.l2 > 0 && <Sayi label="Boğaz çapı" value={params.neckDia} onChange={(v) => u("neckDia", v)} step={0.1} hata={hata.neckDia} tol={params.tolNeck} onTol={(v) => u("tolNeck", v)} />}
            {!kademeli && params.l2 > 0 && <Sayi label="Geçiş açısı" value={params.neckAngle} onChange={(v) => u("neckAngle", v)} step={5} unit="°" hata={hata.neckAngle} />}
            {tip === "taperreamer" && <Sayi label="Uç çapı" value={params.tipD} onChange={(v) => u("tipD", v)} step={0.01} hata={hata.tipD} tol={params.tolTip} onTol={(v) => u("tolTip", v)} />}
            {kademeli && <div className="ipucu">Kesici boy ve çaplar kademelerden hesaplanır.</div>}
          </Grup>

          <Grup baslik="Kesici geometri">
            <Sayi label="Diş sayısı  z" value={params.z} onChange={(v) => u("z", Math.round(v))} unit="Z" min={1} />
            <Sayi label="Helis açısı" value={params.helix} onChange={(v) => u("helix", v)} unit="°" />
            <Sayi label="Çekirdek  dc" value={params.dCore} onChange={(v) => u("dCore", v)} step={0.1} hata={hata.dCore} />
            {tip === "drill" && <Sayi label="Uç açısı" value={params.pointAngle} onChange={(v) => u("pointAngle", v)} unit="°" hata={hata.pointAngle} />}
            {tip === "bullnose" && <Sayi label="Köşe radyüsü  R" value={params.rCorner} onChange={(v) => u("rCorner", v)} step={0.1} hata={hata.rCorner} />}
            {(tip === "chamfer" || tip === "reamer" || tip === "flat") && <Sayi label={tip === "reamer" ? "Giriş pahı" : tip === "flat" ? "Köşe pahı" : "Pah boyu"} value={params.chamferSize} onChange={(v) => u("chamferSize", v)} step={0.1} hata={hata.chamferSize} />}
            <div className="iki" style={{ marginTop: 8 }}>
              <Secim label="Helis yönü" value={params.helixHand} onChange={(v) => u("helixHand", v)} secenekler={[["Sağ", "Sağ"], ["Sol", "Sol"]]} />
              <Secim label="Kesim yönü" value={params.cutDir} onChange={(v) => u("cutDir", v)} secenekler={[["Sağ", "Sağ"], ["Sol", "Sol"]]} />
            </div>
          </Grup>

          {kademeli && (
            <Grup baslik="Kademeler" sag="uçtan sapa">
              {(params.steps || []).map((st, i) => (
                <div key={i} className="kademe">
                  <div className="kademe-ust">
                    <span>KADEME {i + 1}</span>
                    {params.steps.length > 1 && <button className="btn kucuk tehlike" onClick={() => setParams((p) => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }))}>Sil</button>}
                  </div>
                  <div className="uc">
                    {[["dia", "⌀ Çap"], ["len", "Boy"], ["angle", "Açı °"]].map(([alan, ad]) => (
                      <SayiKutu key={alan} label={ad} value={st[alan]} hata={hata[`steps.${i}.${alan}`]} onChange={(v) => adimGuncelle(i, alan, v)} />
                    ))}
                  </div>
                  <div className="iki" style={{ marginBottom: 0 }}>
                    <Metin label="Tol. çap" value={st.tolDia} onChange={(v) => adimGuncelle(i, "tolDia", v)} placeholder="h6, ±0,01" />
                    <Metin label="Tol. boy" value={st.tolLen} onChange={(v) => adimGuncelle(i, "tolLen", v)} placeholder="±0,01" />
                  </div>
                </div>
              ))}
              <button className="btn tam hayalet" onClick={() => setParams((p) => {
                const son = (p.steps || []).slice(-1)[0];
                return { ...p, steps: [...(p.steps || []), { dia: son ? son.dia + 2 : p.D, len: 15, angle: 90, tolDia: "", tolLen: "" }] };
              })}>+ Kademe ekle</button>
            </Grup>
          )}

          <Ek baslik="Sap detayı" rozet={params.sapTipi && params.sapTipi !== "HA" ? `DIN 6535 ${params.sapTipi}` : "Düz"} acik={sapOzel}>
            <Secim label="Sap tipi (DIN 6535)" value={params.sapTipi || "HA"} onChange={(v) => u("sapTipi", v)}
              secenekler={[["HA", "HA — Düz sap"], ["HB", "HB — Weldon düzlüğü"], ["HE", "HE — Whistle Notch"]]} />
            {sapOzel && <>
              <Sayi label="Düzlük boyu" value={params.sapDuzUzunluk || 0} onChange={(v) => u("sapDuzUzunluk", v)} step={0.5} hata={hata.sapDuzUzunluk} />
              <Sayi label="Derinlik  t" value={params.sapDuzDerinlik || 0} onChange={(v) => u("sapDuzDerinlik", v)} step={0.1} hata={hata.sapDuzDerinlik} />
              <div className="ipucu">0 = otomatik (boy ≈ 2·d, derinlik ≈ 0,1·d). Otomatik değerler yaklaşıktır; standart tablosundan teyit edin.</div>
            </>}
          </Ek>

          <Ek baslik="Soğutma deliği" rozet={params.coolantHole ? `${params.coolantCount} delik` : "Yok"} acik={params.coolantHole}>
            <Anahtar acik={params.coolantHole} onChange={(v) => u("coolantHole", v)}>İç soğutma deliği var</Anahtar>
            {params.coolantHole && <Sayi label="Delik sayısı" value={params.coolantCount} onChange={(v) => u("coolantCount", Math.round(v))} unit="ad" min={1} />}
          </Ek>
        </>}

        {/* ═════════ RESİM ═════════ */}
        {sekme === "resim" && <>
          <Grup baslik="Sayfa">
            <div className="iki">
              <Secim label="Kağıt" value={params.kagit} onChange={(v) => u("kagit", v)} secenekler={[["A4", "A4 · 297×210"], ["A3", "A3 · 420×297"]]} />
              <Secim label="Ölçek" value={params.olcek} onChange={(v) => u("olcek", v)} secenekler={[["otomatik", "Otomatik"], ...OLCEKLER.map((o) => [olcekYaz(o), olcekYaz(o)])]} />
            </div>
            <Metin label="Genel tolerans" value={params.genelTolerans} onChange={(v) => u("genelTolerans", v)} />
            <Metin label="Tarih" type="date" value={params.tarih} onChange={(v) => u("tarih", v)} />
            <div className="ipucu">Tarih boşsa bugünün tarihi yazılır.</div>
          </Grup>

          <Grup baslik="Resim stili">
            <div className="cipler">
              <Cip acik={params.sunum !== false} onClick={() => u("sunum", true)}>Sunum · renkli</Cip>
              <Cip acik={params.sunum === false} onClick={() => u("sunum", false)}>Teknik · yalnız çizgi</Cip>
            </div>
            <div className="ipucu">Sunum stilinde gövde gölgeli, kesici bölüm kaplama renginde çizilir (müşteri ve kataloğa uygun). Üretim çizimi için Teknik stili seçin; ölçüler ve DXF her iki stilde aynıdır.</div>
          </Grup>

          <Grup baslik="Resimde göster" sag="aç / kapat">
            <div className="cipler">
              {GOSTER.map(([k, ad]) => {
                const acik = k === "kesitAA" ? params.kesitAA === true : params[k] !== false;
                return <Cip key={k} acik={acik} onClick={() => u(k, !acik)}>{ad}</Cip>;
              })}
            </div>
            <div className="ipucu"><b>Kesit A-A:</b> kanallı bölümün enine kesiti. Diş sayısı (z), çekirdek çapı (dc) ve kesim yönü <i>Takım</i> sekmesinden gelir. Kanal profili şematiktir; gerçek taşlama profilini göstermez, bu yüzden varsayılan kapalıdır.</div>
            <div className="ipucu">Ölçüleri ve etiketleri çizim üzerinde sürükleyerek kaydırabilirsiniz; araç çubuğundaki ↺ konumları sıfırlar.</div>
          </Grup>

          <Grup baslik="Notlar" sag="numaralı balon">
            <div className="liste" style={{ marginBottom: 8 }}>
              {(params.notes || []).map((n, i) => (
                <div key={i} className="liste-oge" style={{ cursor: "default" }}>
                  <span className="not-no">{i + 1}</span>
                  <input className="alan" style={{ flex: 1 }} value={n.text} placeholder="Not yazın…" aria-label={`Not ${i + 1}`}
                    onChange={(e) => { const v = e.target.value; setParams((p) => ({ ...p, notes: p.notes.map((x, j) => (j === i ? { ...x, text: v } : x)) })); }} />
                  <button className="btn kucuk tehlike" aria-label={`Not ${i + 1} sil`} onClick={() => setParams((p) => ({ ...p, notes: p.notes.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn tam hayalet" onClick={() => setParams((p) => ({ ...p, notes: [...(p.notes || []), { text: `Not ${(p.notes || []).length + 1}` }] }))}>+ Not ekle</button>
          </Grup>

          <Grup baslik="Onay damgası">
            <div className="cipler">
              {DAMGALAR.map(([v, ad, sinif]) => <Cip key={v} sinif={sinif} acik={params.stamp === v} onClick={() => u("stamp", v)}>{ad}</Cip>)}
            </div>
            {params.stamp && <div style={{ marginTop: 10 }}><Metin label="Damga tarihi" type="date" value={params.stampDate || new Date().toISOString().slice(0, 10)} onChange={(v) => u("stampDate", v)} /></div>}
          </Grup>
        </>}

        {/* ═════════ BELGE ═════════ */}
        {sekme === "belge" && <>
          <Grup baslik="Takım">
            <Metin label="Alet adı" value={params.toolName} onChange={(v) => u("toolName", v)} />
            <div className="iki">
              <Metin label="Malzeme" value={params.material} onChange={(v) => u("material", v)} />
              <Metin label="Kaplama" value={params.coating} onChange={(v) => u("coating", v)} />
            </div>
          </Grup>

          <Grup baslik="Çizim bilgisi">
            <div className="iki">
              <Metin label="Çizim no" value={params.drawingNo} onChange={(v) => u("drawingNo", v)} />
              <Metin label="Revizyon" value={params.revision} onChange={(v) => u("revision", v)} />
            </div>
            <div className="iki">
              <Metin label="Çizen" value={params.createdBy} onChange={(v) => u("createdBy", v)} placeholder="Varsayılan: firma" />
              <Metin label="Onaylayan" value={params.approvedBy} onChange={(v) => u("approvedBy", v)} />
            </div>
          </Grup>

          <Grup baslik="Müşteri ve sipariş">
            <Anahtar acik={params.customerMode} onChange={(v) => u("customerMode", v)} altMetin="Antette telefon, e-posta ve web adresini gizler">Müşteri modu</Anahtar>
            <Metin label="Müşteri adı" value={params.customerName} onChange={(v) => u("customerName", v)} placeholder="ör. ABC Makina" />
            <div className="iki">
              <Metin label="İE / sipariş no" value={params.orderNo} onChange={(v) => u("orderNo", v)} placeholder="SIP-2026-001" />
              <Metin label="Teslim tarihi" type="date" value={params.deliveryDate} onChange={(v) => u("deliveryDate", v)} />
            </div>
          </Grup>

          {(params.ekOzellikler || []).length > 0 && (
            <Grup baslik="Üretim özellikleri" sag={`${params.ekOzellikler.length} kayıt · iş emrinden`}>
              <Anahtar acik={params.ekGoster !== false} onChange={(v) => u("ekGoster", v)} altMetin="Çizilmeyen taşlama/üretim verileri sayfada tablo olarak görünür">Resimde göster</Anahtar>
              <div className="liste" style={{ marginTop: 8, marginBottom: 8 }}>
                {params.ekOzellikler.map(([ad, deger], i) => (
                  <div key={i} className="liste-oge" style={{ cursor: "default", padding: "6px 10px" }}>
                    <div className="govde"><div className="ad" style={{ fontWeight: 500, fontSize: 13 }}>{ad}</div></div>
                    <span className="alt" style={{ color: "var(--text-hi)" }}>{deger}</span>
                  </div>
                ))}
              </div>
              <button className="btn tam hayalet" onClick={() => u("ekOzellikler", [])}>Tabloyu temizle</button>
            </Grup>
          )}

          <Grup baslik="Paylaş">
            <div className="btn-satir">
              <button className="btn" onClick={() => paylas(params, "wa")}>WhatsApp</button>
              <button className="btn" onClick={() => paylas(params, "mail")}>E-posta</button>
            </div>
            <div className="ipucu">Telefonda resim doğrudan paylaşım menüsüyle gider; bilgisayarda ilgili uygulama açılır.</div>
          </Grup>
        </>}

        {/* ═════════ KÜTÜPHANE ═════════ */}
        {sekme === "kutuphane" && <LibraryPanel params={params} setParams={setParams} />}
      </div>
    </aside>
  );
}

export { Panel };
