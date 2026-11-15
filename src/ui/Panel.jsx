import { useCallback, useEffect, useMemo, useState } from "react";
import { tipDegistir } from "../geometry/tipler";
import { takimProfili } from "../geometry/profil";
import { disProfiliHatalari, disVerisiVar, disProfiliYeterli } from "../geometry/disProfili";
import { OLCEKLER, olcekYaz } from "../drawing/sayfaDuzeni";
import { pngBlobu, dosyaIndir } from "../io/export";
import { guvenliAd } from "../io/dosya";
import { logoAl } from "../assets/images";
import { Sayi, SayiKutu, Metin, Secim, Anahtar, Cip, Grup, Ek } from "./inputs";
import { LibraryPanel } from "./LibraryPanel";
import { TipSecici } from "./TipSecici";
import { Ikon } from "./Ikon";
import { DILLER } from "../drawing/metinler";
import { onayla, onaylanabilir, yeniRevizyon, sonrakiRevizyon, sonSatiriSil } from "../io/onay";

const fmtSayi = (v) => String(Math.round((+v || 0) * 1000) / 1000).replace(".", ",");

const SEKMELER = [["takim", "Takım"], ["resim", "Resim"], ["belge", "Belge"], ["kutuphane", "Kütüphane"]];

const GOSTER = [
  ["showDimD", "⌀D"], ["showDimd", "⌀d"], ["showDimL", "L"], ["showDiml1", "l₁"], ["showDiml2", "l₂"],
  ["showDimNeck", "⌀ Boğaz"], ["showDimHelix", "Helis açısı"], ["showDimAngles", "Açı / R / pah"],
  ["kesitAA", "Kesit A-A"], ["detayA", "Uç detayı"], ["disProfili", "Diş profili"],
];

const DAMGALAR = [
  ["", "Yok", ""], ["ONAYLANDI", "Onaylandı", "damga-onay"], ["TASLAK", "Taslak", ""], ["REVİZYON", "Revizyon", ""], ["İPTAL", "İptal", "damga-iptal"],
];

/**
 * Resmi paylaşır. Telefonda (Web Share) dosya doğrudan paylaşım menüsüne gider. Bilgisayarda
 * tarayıcı dosya eklemeyi desteklemez: PNG önce indirilir, WhatsApp / e-posta açılır ve
 * kullanıcıya dosyayı eklemesi söylenir.
 */
async function paylas(params, tur) {
  const svg = document.getElementById("teknik-svg");
  if (!svg) return;
  const ad = params.toolName || "teknik-resim";
  let blob = null;
  try {
    blob = await pngBlobu(svg, 6);
    const dosya = new File([blob], `${ad}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
      await navigator.share({ title: `${ad} - Teknik Resim`, text: `MİHENK Kesici Takımlar - ${ad}`, files: [dosya] });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  if (blob) dosyaIndir(blob, `${guvenliAd(ad)}.png`);
  const baslik = `${ad} - MİHENK Teknik Resim`;
  const govde = "Teknik resim ektedir (indirilen PNG dosyasını ekleyin).";
  window.open(tur === "wa"
    ? `https://wa.me/?text=${encodeURIComponent(`${baslik}
${govde}`)}`
    : `mailto:?subject=${encodeURIComponent(baslik)}&body=${encodeURIComponent(govde)}`, "_blank");
}

function Panel({ params, setParams, dimOff, kayitYukle, odak, isMobile, showPanel, onClose, onYeni }) {
  const [sekme, setSekme] = useState("takim");
  const [revAciklama, setRevAciklama] = useState("");
  const [onayMesaj, setOnayMesaj] = useState("");
  const islem = (f) => { try { setParams(f(params)); setOnayMesaj(""); return true; } catch (e) { setOnayMesaj(e.message); return false; } };
  const u = useCallback((k, v) => setParams((p) => ({ ...p, [k]: v })), [setParams]);
  const profil = useMemo(() => takimProfili(params), [params]);
  const hatalar = useMemo(() => [...profil.hatalar, ...disProfiliHatalari(params, profil)], [params, profil]);
  const hata = useMemo(() => Object.fromEntries(hatalar.map((h) => [h.alan, h.mesaj])), [hatalar]);
  const tip = params.toolType;
  // Çizimde bir ölçüye çift tıklanınca: Takım sekmesi açılır, ilgili alan seçili gelir
  useEffect(() => {
    if (!odak) return;
    setSekme("takim");
    const t = setTimeout(() => {
      const e = document.querySelector(`input[data-alan="${odak.alan}"]`);
      if (e) { e.scrollIntoView({ block: "center", behavior: "smooth" }); e.focus(); }
    }, 60);
    return () => clearTimeout(t);
  }, [odak]);
  const kademeli = tip === "stepdrill";
  const ozel = tip === "custom";
  const noktaGuncelle = (i, alan, v) => setParams((p) => ({ ...p, profilNoktalari: (p.profilNoktalari || []).map((n, j) => (j === i ? { ...n, [alan]: v } : n)) }));
  const adimGuncelle = (i, alan, v) => setParams((p) => ({ ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, [alan]: v } : s)) }));
  const sapOzel = params.sapTipi && params.sapTipi !== "HA";

  return (
    <aside className={`panel${isMobile && !showPanel ? " kapali" : ""}`} aria-label="Takım ayarları">
      <div className="panel-ust">
        <img src={logoAl()} alt="Firma logosu" />
        <div className="baslik"><b>Teknik Resim</b><span>Kesici takım çizim sistemi</span></div>
        <button className="btn kucuk" title="Boş bir takımla yeni resim başlat (taslak otomatik kaydedilir)" onClick={onYeni}>+ Yeni</button>
        {isMobile && <button className="btn kucuk ikon" onClick={onClose} aria-label="Paneli kapat"><Ikon ad="kapat" boyut={16} /></button>}
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

          <TipSecici deger={tip} onSec={(v) => setParams((p) => tipDegistir(p, v))} />

          <Grup baslik="Ana ölçüler" sag="değer · tolerans">
            {!kademeli && !ozel && <Sayi alan="D" label="Kesici çap  D" value={params.D} onChange={(v) => u("D", v)} step={0.5} hata={hata.D} tol={params.tolD} onTol={(v) => u("tolD", v)} />}
            {!ozel && <Sayi alan="d" label="Sap çapı  d" value={params.d} onChange={(v) => u("d", v)} step={0.5} hata={hata.d} tol={params.told} onTol={(v) => u("told", v)} />}
            {!ozel && <Sayi alan="L" label="Toplam boy  L" value={params.L} onChange={(v) => u("L", v)} hata={hata.L} tol={params.tolL} onTol={(v) => u("tolL", v)} />}
            {!kademeli && !ozel && <Sayi alan="l1" label="Kesici boy  l₁" value={params.l1} onChange={(v) => u("l1", v)} step={0.5} hata={hata.l1} tol={params.toll1} onTol={(v) => u("toll1", v)} />}
            {!kademeli && !ozel && <Sayi alan="l2" label="Boğaz boyu  l₂" value={params.l2} onChange={(v) => u("l2", v)} step={0.5} tol={params.toll2} onTol={(v) => u("toll2", v)} />}
            {!kademeli && !ozel && params.l2 > 0 && <Sayi alan="neckDia" label="Boğaz çapı" value={params.neckDia} onChange={(v) => u("neckDia", v)} step={0.1} hata={hata.neckDia} tol={params.tolNeck} onTol={(v) => u("tolNeck", v)} />}
            {!kademeli && !ozel && params.l2 > 0 && <Sayi label="Geçiş açısı" value={params.neckAngle} onChange={(v) => u("neckAngle", v)} step={5} unit="°" hata={hata.neckAngle} />}
            {tip === "taperreamer" && <Sayi alan="tipD" label="Uç çapı" value={params.tipD} onChange={(v) => u("tipD", v)} step={0.01} hata={hata.tipD} tol={params.tolTip} onTol={(v) => u("tolTip", v)} />}
            {kademeli && <div className="ipucu">Kesici boy ve çaplar kademelerden hesaplanır.</div>}
            {ozel && (<>
              <div className="uc">
                <Metin label="Tol. ⌀D" value={params.tolD} onChange={(v) => u("tolD", v)} placeholder="h6" />
                <Metin label="Tol. ⌀d" value={params.told} onChange={(v) => u("told", v)} placeholder="h6" />
                <Metin label="Tol. L" value={params.tolL} onChange={(v) => u("tolL", v)} placeholder="±0,1" />
              </div>
              <div className="ipucu">⌀D, ⌀d ve L profil noktalarından hesaplanır: D = {fmtSayi(profil.D)} · d = {fmtSayi(profil.d)} · L = {fmtSayi(profil.L)} mm.</div>
            </>)}
          </Grup>

          {ozel && (
            <Grup baslik="Profil noktaları" sag="sap ucundan uca">
              {(params.profilNoktalari || []).map((nk, i, liste) => (
                <div key={i} className="nokta-satir">
                  <span className="nokta-no">{i + 1}</span>
                  <SayiKutu label={i === 0 ? "x (mm)" : ""} value={nk.x} hata={hata.profil && i === 0 ? hata.profil : undefined} onChange={(v) => noktaGuncelle(i, "x", v)} />
                  <SayiKutu label={i === 0 ? "⌀ (mm)" : ""} value={nk.dia} onChange={(v) => noktaGuncelle(i, "dia", v)} />
                  <button className="btn kucuk tehlike" disabled={liste.length <= 2} aria-label={`${i + 1}. noktayı sil`} onClick={() => setParams((p) => ({ ...p, profilNoktalari: p.profilNoktalari.filter((_, j) => j !== i) }))}><Ikon ad="kapat" boyut={14} /></button>
                </div>
              ))}
              <div className="btn-satir" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => setParams((p) => {
                  const l = p.profilNoktalari || [];
                  const son = l[l.length - 1] || { x: 0, dia: 10 }, onceki = l[l.length - 2] || son;
                  const yeni = { x: +((onceki.x + son.x) / 2).toFixed(3), dia: +((onceki.dia + son.dia) / 2).toFixed(3) };
                  return { ...p, profilNoktalari: [...l.slice(0, -1), yeni, son] };
                })}>+ Nokta ekle</button>
                <button className="btn hayalet" onClick={() => setParams((p) => ({ ...p, profilNoktalari: [...(p.profilNoktalari || [])].sort((a, b) => (+a.x || 0) - (+b.x || 0)) }))}>x'e göre sırala</button>
              </div>
              <div className="ipucu">Noktalar sap ucundan (x = 0) takım ucuna doğru, aralarında doğru çizgiyle birleşir. Aynı x'e iki nokta girerseniz dikey basamak olur. Son noktada ⌀ 0 sivri uç demektir.</div>
            </Grup>
          )}

          <Grup baslik="Kesici geometri">
            {ozel && <Sayi label="Kesici bölüm başı  x" value={params.ozelKesiciBas} onChange={(v) => u("ozelKesiciBas", v)} step={0.5} hata={hata.ozelKesiciBas} />}
            {ozel && <div className="ipucu" style={{ marginTop: -2, marginBottom: 6 }}>0 = otomatik (kanallı bölüm en büyük çapa ulaşılan yerden başlar).</div>}
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

          <Ek baslik="Salgı toleransı" rozet={params.salgi ? `${params.salgi}` : "Yok"} acik={!!params.salgi}>
            <Metin label="Salgı (kesici kısım, A datumuna göre)" value={params.salgi} onChange={(v) => u("salgi", v)} placeholder="ör. 0,01" />
            <div className="ipucu">Boşsa çizilmez. Girilince sap üstüne A datumu ve kesici kısma tolerans çerçevesi konur. Değeri siz yazarsınız; program standart tablodan değer önermez.</div>
          </Ek>

          <Ek baslik="Diş profili detayı" rozet={disProfiliYeterli(params) ? "Var" : disVerisiVar(params) ? "Eksik" : "Yok"} acik={disVerisiVar(params)}>
            <Sayi label="Kesme açısı  γ" value={params.dpKesme} onChange={(v) => u("dpKesme", v)} step={1} unit="°" hata={hata.dpKesme} />
            <Sayi label="1. serbest yüzey gen." value={params.dpSy1Gen} onChange={(v) => u("dpSy1Gen", v)} step={0.1} hata={hata.dpSy1Gen} />
            <Sayi label="1. serbest yüzey açısı" value={params.dpSy1Aci} onChange={(v) => u("dpSy1Aci", v)} step={1} unit="°" hata={hata.dpSy1Aci} />
            <Sayi label="2. serbest yüzey gen." value={params.dpSy2Gen} onChange={(v) => u("dpSy2Gen", v)} step={0.1} hata={hata.dpSy2Gen} />
            <Sayi label="2. serbest yüzey açısı" value={params.dpSy2Aci} onChange={(v) => u("dpSy2Aci", v)} step={1} unit="°" hata={hata.dpSy2Aci} />
            <div className="ipucu">0 = girilmedi. Uçtan kesit detayı kesme açısı ve 1. serbest yüzey ile çizilir; 2. serbest yüzey isteğe bağlıdır. Yalnız <b>İş emri çiziminde</b> görünür. Şematiktir: açı ve genişlikler ölçeklidir, kanal tabanı gerçek profil değildir.</div>
          </Ek>

          {!ozel && (<Ek baslik="Sap detayı" rozet={params.sapTipi && params.sapTipi !== "HA" ? `DIN 6535 ${params.sapTipi}` : "Düz"} acik={sapOzel}>
            <Secim label="Sap tipi (DIN 6535)" value={params.sapTipi || "HA"} onChange={(v) => u("sapTipi", v)}
              secenekler={[["HA", "HA — Düz sap"], ["HB", "HB — Weldon düzlüğü"], ["HE", "HE — Whistle Notch"]]} />
            {sapOzel && <>
              <Sayi label="Düzlük boyu" value={params.sapDuzUzunluk || 0} onChange={(v) => u("sapDuzUzunluk", v)} step={0.5} hata={hata.sapDuzUzunluk} />
              <Sayi label="Derinlik  t" value={params.sapDuzDerinlik || 0} onChange={(v) => u("sapDuzDerinlik", v)} step={0.1} hata={hata.sapDuzDerinlik} />
              <div className="ipucu">0 = otomatik (boy ≈ 2·d, derinlik ≈ 0,1·d). Otomatik değerler yaklaşıktır; standart tablosundan teyit edin.</div>
            </>}
          </Ek>)}

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
            <Secim label="Resim dili" value={params.dil || "tr"} onChange={(v) => u("dil", v)} secenekler={DILLER} />
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
            <div className="ipucu">Takımı, detayı, uçtan görünüşü ve kesiti çizim üzerinde tutup sürükleyerek yerlerini değiştirebilirsiniz; ölçüler ve etiketler ayrıca kendi başlarına kayar. Araç çubuğundaki ↺ tüm konumları sıfırlar.</div>
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
          <Grup baslik="Çizim türü">
            <div className="cipler">
              <Cip acik={params.cizimTuru !== "ie"} onClick={() => u("cizimTuru", "musteri")}>Müşteri çizimi</Cip>
              <Cip acik={params.cizimTuru === "ie"} onClick={() => u("cizimTuru", "ie")}>İş emri çizimi</Cip>
            </div>
            <div className="ipucu">Antet ve alt kutuların ölçüleri iki türde de aynıdır. <b>Müşteri çizimi:</b> antetin solunda Teknik veri tablosu. <b>İş emri çizimi:</b> aynı yerde, varsa, Üretim özellikleri tablosu.</div>
          </Grup>

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

          <Grup baslik="Onay ve revizyon" sag={params.stamp ? `${params.stamp.toLowerCase()}` : "taslak"}>
            <div className="ipucu" style={{ marginTop: 0, marginBottom: 8 }}>
              Akış: Taslak → <b>Onayla</b> (onaylayan adı gerekir) → ONAYLANDI → değişiklik için <b>Yeni revizyon</b> → REVİZYON → yeniden onay. Her adım geçmişe ve sayfadaki revizyon tablosuna yazılır.
            </div>
            <button className="btn tam" disabled={!onaylanabilir(params).var} title={onaylanabilir(params).neden} onClick={() => islem(onayla)}>
              {params.stamp === "ONAYLANDI" ? "Onaylı" : "Onayla"}
            </button>
            {!onaylanabilir(params).var && <div className="ipucu">{onaylanabilir(params).neden}</div>}
            <div style={{ marginTop: 10 }}>
              <Metin label={`Yeni revizyon (${sonrakiRevizyon(params.revision)}) — ne değişti?`} value={revAciklama} onChange={setRevAciklama} placeholder="ör. Kesici boy 25 → 30" />
              <button className="btn tam hayalet" onClick={() => { if (islem((p) => yeniRevizyon(p, revAciklama))) setRevAciklama(""); }}>Yeni revizyon aç</button>
            </div>
            {onayMesaj && <div className="ipucu" style={{ color: "var(--accent2)" }}>{onayMesaj}</div>}
            {(params.revizyonlar || []).length > 0 && (
              <>
                <div className="liste" style={{ marginTop: 10 }}>
                  {[...params.revizyonlar].reverse().map((r, i) => (
                    <div key={i} className="liste-oge" style={{ cursor: "default", padding: "6px 10px" }}>
                      <span className="not-no" style={{ background: "var(--accent)", color: "#1b1305", width: "auto", minWidth: 22, padding: "0 5px", borderRadius: 11 }}>{r.rev}</span>
                      <div className="govde"><div className="ad" style={{ fontWeight: 500, fontSize: 13 }}>{r.aciklama}</div><div className="alt">{r.tarih} · {r.kisi}</div></div>
                    </div>
                  ))}
                </div>
                <button className="btn kucuk hayalet" style={{ marginTop: 8 }} onClick={() => islem(sonSatiriSil)}>Son satırı sil</button>
              </>
            )}
          </Grup>

          <Grup baslik="Müşteri ve sipariş">
            <Metin label="Müşteri adı" value={params.customerName} onChange={(v) => u("customerName", v)} placeholder="ör. ABC Makina" />
            <div className="iki">
              <Metin label="İE / sipariş no" value={params.orderNo} onChange={(v) => u("orderNo", v)} placeholder="SIP-2026-001" />
              <Metin label="Teslim tarihi" type="date" value={params.deliveryDate} onChange={(v) => u("deliveryDate", v)} />
            </div>
          </Grup>

          {(params.ekOzellikler || []).length > 0 && (
            <Grup baslik="Üretim özellikleri" sag={`${params.ekOzellikler.length} kayıt · iş emrinden`}>
              <Anahtar acik={params.ekGoster !== false} onChange={(v) => u("ekGoster", v)} altMetin={params.cizimTuru === "ie" ? "Çizilmeyen taşlama/üretim verileri sayfada tablo olarak görünür" : "Yalnız İş emri çiziminde görünür; Çizim türü şu an Müşteri çizimi"}>Resimde göster</Anahtar>
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
            <div className="ipucu">Telefonda resim doğrudan paylaşım menüsüyle gider. Bilgisayarda PNG indirilir ve uygulama açılır; dosyayı siz eklersiniz.</div>
          </Grup>
        </>}

        {/* ═════════ KÜTÜPHANE ═════════ */}
        {sekme === "kutuphane" && <LibraryPanel params={params} dimOff={dimOff} yukle={kayitYukle} />}
      </div>
    </aside>
  );
}

export { Panel };
