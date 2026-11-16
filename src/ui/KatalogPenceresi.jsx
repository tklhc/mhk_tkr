import { useEffect, useMemo, useState } from "react";
import { KatalogSayfasi, katalogSayfalari, katalogIzgara } from "../drawing/Katalog";
import { DILLER } from "../drawing/metinler";
import { pdfIndir, pngIndir, svgIndir } from "../io/export";
import { guvenliAd } from "../io/dosya";
import { Ikon } from "./Ikon";
import { Secim, Metin, Anahtar } from "./inputs";

function kutuphaneOku() {
  try { const v = JSON.parse(localStorage.getItem("mihenk-lib") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

/**
 * Katalog sayfası: kütüphanedeki (ve isterseniz geçerli) takımlardan, her takımın küçük resmi ve temel
 * özellikleriyle A4 katalog sayfaları üretir; PDF / PNG / SVG olarak indirilir.
 */
export function KatalogPenceresi({ mevcut, kapat }) {
  const lib = useMemo(kutuphaneOku, []);
  const [secili, setSecili] = useState(() => new Set(lib.map((t) => t.toolName)));
  const [mevcutDahil, setMevcutDahil] = useState(lib.length === 0);
  const [baslik, setBaslik] = useState("");
  const [sutun, setSutun] = useState("3");
  const [dil, setDil] = useState(mevcut.dil === "en" ? "en" : "tr");
  const [sayfa, setSayfa] = useState(0);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [kapat]);

  const takimlar = useMemo(() => [...(mevcutDahil ? [mevcut] : []), ...lib.filter((t) => secili.has(t.toolName))], [mevcutDahil, mevcut, lib, secili]);
  const sayfalar = useMemo(() => katalogSayfalari(takimlar, +sutun), [takimlar, sutun]);
  const aktif = Math.min(sayfa, sayfalar.length - 1);
  const ad = guvenliAd(baslik || "katalog");
  const svgAl = (i) => document.getElementById(`katalog-svg-${i}`);
  const sinir = katalogIzgara(+sutun).adet;

  const indir = async (tur, i = aktif) => {
    const s = svgAl(i);
    if (!s) return;
    const dosya = sayfalar.length > 1 ? `${ad}-${i + 1}` : ad;
    try {
      if (tur === "pdf") await pdfIndir(s, dosya);
      else if (tur === "png") await pngIndir(s, `${dosya}.png`);
      else svgIndir(s, `${dosya}.svg`);
    } catch (e) { setMesaj(`İndirilemedi: ${e.message}`); }
  };
  const hepsi = async () => {
    for (let i = 0; i < sayfalar.length; i++) { await indir("pdf", i); await new Promise((r) => setTimeout(r, 500)); }
    setMesaj(`${sayfalar.length} sayfa indirildi.`);
  };
  const degis = (toolName) => setSecili((o) => { const y = new Set(o); if (y.has(toolName)) y.delete(toolName); else y.add(toolName); return y; });

  return (
    <div className="modal-perde" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <div className="modal genis" role="dialog" aria-modal="true" aria-label="Katalog sayfası">
        <div className="modal-ust">
          <b>Katalog sayfası</b>
          <button className="btn kucuk ikon hayalet" onClick={kapat} aria-label="Kapat"><Ikon ad="kapat" boyut={16} /></button>
        </div>
        <div className="modal-govde katalog-govde">
          <div className="katalog-sol">
            <Metin label="Başlık" value={baslik} onChange={setBaslik} placeholder={dil === "en" ? "Tool Catalog" : "Takım Kataloğu"} />
            <div className="iki">
              <Secim label="Sütun" value={sutun} onChange={(v) => { setSutun(v); setSayfa(0); }} secenekler={[["2", "2 sütun"], ["3", "3 sütun"], ["4", "4 sütun"]]} />
              <Secim label="Dil" value={dil} onChange={setDil} secenekler={DILLER} />
            </div>
            <Anahtar acik={mevcutDahil} onChange={(v) => { setMevcutDahil(v); setSayfa(0); }} altMetin="Çizimde şu an açık olan takım">Geçerli takımı ekle</Anahtar>
            <div className="grup-baslik" style={{ marginTop: 10 }}>Kütüphane <small>{secili.size} / {lib.length}</small></div>
            {lib.length === 0
              ? <div className="ipucu">Kütüphanede kayıtlı takım yok. Panelde Kütüphane sekmesinden takım kaydedin; ya da yalnız geçerli takımı katalogla.</div>
              : (
                <>
                  <div className="btn-satir" style={{ marginBottom: 6 }}>
                    <button className="btn kucuk" onClick={() => { setSecili(new Set(lib.map((t) => t.toolName))); setSayfa(0); }}>Hepsi</button>
                    <button className="btn kucuk hayalet" onClick={() => { setSecili(new Set()); setSayfa(0); }}>Hiçbiri</button>
                  </div>
                  <div className="katalog-liste">
                    {lib.map((t) => (
                      <label key={t.toolName} className="katalog-oge">
                        <input type="checkbox" checked={secili.has(t.toolName)} onChange={() => { degis(t.toolName); setSayfa(0); }} />
                        <span>{t.toolName}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            <div className="ipucu">Sayfa başına {sinir} takım · toplam {takimlar.length} takım, {sayfalar.length} sayfa.</div>
            {mesaj && <div className="ipucu" style={{ color: "var(--accent2)" }}>{mesaj}</div>}
          </div>

          <div className="katalog-sag">
            {takimlar.length === 0
              ? <div className="ipucu" style={{ textAlign: "center", padding: 40 }}>Katalogda gösterilecek takım seçin.</div>
              : sayfalar.map((s, i) => (
                <div key={i} style={{ display: i === aktif ? "block" : "none" }} className="katalog-onizleme">
                  <KatalogSayfasi id={`katalog-svg-${i}`} takimlar={s} sayfa={i + 1} sayfaSayisi={sayfalar.length} baslik={baslik} sutun={+sutun} dil={dil} tarih={mevcut.tarih} />
                </div>
              ))}
            {sayfalar.length > 1 && (
              <div className="katalog-sayfa">
                <button className="btn kucuk" disabled={aktif === 0} onClick={() => setSayfa(aktif - 1)}>◀</button>
                <span>Sayfa {aktif + 1} / {sayfalar.length}</span>
                <button className="btn kucuk" disabled={aktif >= sayfalar.length - 1} onClick={() => setSayfa(aktif + 1)}>▶</button>
              </div>
            )}
          </div>
        </div>
        <div className="modal-alt">
          <button className="btn hayalet" onClick={kapat}>Kapat</button>
          <button className="btn" disabled={takimlar.length === 0} onClick={() => indir("svg")}>SVG</button>
          <button className="btn" disabled={takimlar.length === 0} onClick={() => indir("png")}>PNG</button>
          {sayfalar.length > 1 && <button className="btn" disabled={takimlar.length === 0} onClick={hepsi}>Tüm sayfalar (PDF)</button>}
          <button className="btn birincil" disabled={takimlar.length === 0} onClick={() => indir("pdf")}>{sayfalar.length > 1 ? "Bu sayfa (PDF)" : "PDF indir"}</button>
        </div>
      </div>
    </div>
  );
}
