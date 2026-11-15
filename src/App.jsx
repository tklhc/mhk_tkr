import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DEFAULT_PARAMS } from "./constants";
import { Sayfa, duzenHesapla } from "./drawing/Sayfa";
import { olcekYaz } from "./drawing/sayfaDuzeni";
import { Panel } from "./ui/Panel";
import { Menu, MenuOge, MenuAyrac } from "./ui/Menu";
import { csvOku, csvMetniOku, getInitialBatch } from "./io/csv";
import { ThreeDView } from "./view3d/ThreeDView";
import { downloadExcel, generateTemplateExcel, generateExcelReport } from "./io/excel";
import { generateDXF } from "./io/dxf";
import { svgIndir, pngIndir, pdfYazdir, dosyaIndir } from "./io/export";

const TASLAK = "mihenk-taslak-v1";
const ZOOM_MIN = 1, ZOOM_MAX = 5;
const sinirla = (z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
const dosyaAdi = (p) => (p.toolName || "teknik-resim").replace(/[\\/:*?"<>|]+/g, "_").trim() || "teknik-resim";

/** Son çalışma: tarayıcıda saklanan taslak (bozuksa ya da yoksa null). */
function taslakYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(TASLAK));
    if (k && k.params && typeof k.params === "object") return { params: { ...DEFAULT_PARAMS, ...k.params }, dimOff: k.dimOff && typeof k.dimOff === "object" ? k.dimOff : {} };
  } catch { /* depolama kapalı ya da bozuk: boş başla */ }
  return null;
}

function App() {
  const ilk = useRef(undefined);
  if (ilk.current === undefined) ilk.current = taslakYukle();

  const [params, setParams] = useState(ilk.current?.params ?? DEFAULT_PARAMS);
  const [dimOff, setDimOff] = useState(ilk.current?.dimOff ?? {});
  const [view, setView] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [batch, setBatch] = useState([]);
  const [batchIdx, setBatchIdx] = useState(0);
  const csvGirdi = useRef(null);

  // ── Taslak otomatik kaydı ──
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(TASLAK, JSON.stringify({ params, dimOff })); } catch { /* depolama dolu/kapalı */ }
    }, 500);
    return () => clearTimeout(t);
  }, [params, dimOff]);

  const yeni = useCallback(() => {
    if (!window.confirm("Geçerli çizim kapatılıp varsayılan takımla yeni resim başlatılsın mı?\n(Kütüphanede kayıtlı takımlar etkilenmez.)")) return;
    setParams(DEFAULT_PARAMS); setDimOff({}); setBatch([]); setBatchIdx(0);
  }, []);

  // ── Yakınlaştırma ve kaydırma ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const gestureRef = useRef({ lastDist: 0, startPan: { x: 0, y: 0 }, isPinching: false, isPanning: false, mouse: false });
  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const yakinlastir = useCallback((carpan) => setZoom((z) => { const y = sinirla(z * carpan); if (y === 1) setPan({ x: 0, y: 0 }); return y; }), []);

  const onTouchStart = useCallback((e) => {
    const g = gestureRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      g.lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      g.isPinching = true; g.isPanning = false;
    } else if (e.touches.length === 1 && zoom > 1) {
      g.startPan = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
      g.isPanning = true; g.isPinching = false;
    }
  }, [zoom, pan]);

  const onTouchMove = useCallback((e) => {
    const g = gestureRef.current;
    if (g.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (g.lastDist > 0) setZoom((z) => sinirla(z * (dist / g.lastDist)));
      g.lastDist = dist;
    } else if (g.isPanning && e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      setPan({ x: e.touches[0].clientX - g.startPan.x, y: e.touches[0].clientY - g.startPan.y });
    }
  }, [zoom]);

  const onTouchEnd = useCallback(() => {
    const g = gestureRef.current;
    g.isPinching = false; g.isPanning = false; g.lastDist = 0;
  }, []);

  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => sinirla(z - e.deltaY * 0.003));
    }
  }, []);

  // Fare ile kaydırma (yalnız yakınlaştırılmışken; ölçü sürüklemeleri kendi olayını durdurur)
  const onMouseDown = useCallback((e) => {
    if (zoom <= 1 || e.button !== 0) return;
    gestureRef.current.mouse = true;
    gestureRef.current.startPan = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [zoom, pan]);
  const onMouseMove = useCallback((e) => {
    const g = gestureRef.current;
    if (g.mouse) setPan({ x: e.clientX - g.startPan.x, y: e.clientY - g.startPan.y });
  }, []);
  const onMouseUp = useCallback(() => { gestureRef.current.mouse = false; }, []);

  useEffect(() => { resetZoom(); }, [view, resetZoom]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setShowPanel(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const duzen = useMemo(() => duzenHesapla(params), [params]);
  const svgAl = () => document.getElementById("teknik-svg");
  const adAl = dosyaAdi(params);

  const topluGit = (i) => { setBatchIdx(i); setParams((p) => ({ ...p, ...batch[i] })); setDimOff({}); };

  const csvSec = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { items, uyarilar } = csvOku(csvMetniOku(ev.target.result));
      if (items.length > 0) { setBatch(items); setBatchIdx(0); setParams((p) => ({ ...p, ...items[0] })); setDimOff({}); }
      if (items.length === 0) alert("CSV dosyası okunamadı veya boş.");
      else if (uyarilar.length > 0) alert(`${items.length} takım okundu. ${uyarilar.length} uyarı:\n\n` + uyarilar.slice(0, 8).join("\n") + (uyarilar.length > 8 ? `\n… (+${uyarilar.length - 8})` : ""));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const cizimde = view !== "3d";

  return (
    <div className="uygulama">
      <Panel params={params} setParams={setParams} isMobile={isMobile} showPanel={showPanel} onClose={() => setShowPanel(false)} onYeni={yeni} />
      {isMobile && showPanel && <div className="perde" onClick={() => setShowPanel(false)} />}

      <main className="ana">
        {/* ── Araç çubuğu ── */}
        <div className="arac">
          {isMobile && <button className="btn ikon" onClick={() => setShowPanel(true)} aria-label="Takım ayarlarını aç">☰</button>}

          <div className="segment" role="tablist" aria-label="Görünüm">
            {[["all", "Çizim"], ["3d", "3D"]].map(([v, ad]) => (
              <button key={v} role="tab" aria-selected={view === v} className={view === v ? "acik" : ""} onClick={() => setView(v)}>{ad}</button>
            ))}
          </div>

          <div className="durum">
            <b>{olcekYaz(duzen.yan.olcek)}</b> · {duzen.kagit.ad} · ⌀{params.D}×{params.L} mm · {params.z}Z
          </div>
          <div className="bosluk" />

          <button className="btn ikon hayalet" title="Ölçü ve etiket konumlarını sıfırla" aria-label="Ölçü konumlarını sıfırla" onClick={() => setDimOff({})}>↺</button>

          <Menu etiket="Veri" ikon="⇅ ">
            <MenuOge onClick={() => csvGirdi.current?.click()} altMetin="UTF-8 ya da Excel (Windows-1254) CSV">CSV içe aktar…</MenuOge>
            <MenuOge onClick={() => downloadExcel(generateTemplateExcel(), "mihenk-takim-sablonu.xls")} altMetin="Doldurup CSV olarak kaydedin">Şablon indir (.xls)</MenuOge>
            <MenuOge onClick={() => {
              let lib = [];
              try { lib = JSON.parse(localStorage.getItem("mihenk-lib") || "[]"); } catch { /* boş */ }
              const html = generateExcelReport(batch, lib);
              if (!html) { alert("Rapor için toplu liste ya da kütüphanede kayıt olmalı."); return; }
              downloadExcel(html, `mihenk-rapor-${new Date().toISOString().slice(0, 10)}.xls`);
            }} altMetin="Toplu liste ya da kütüphane">Excel raporu</MenuOge>
            <MenuAyrac />
            <MenuOge onClick={() => { const it = getInitialBatch(); setBatch(it); setBatchIdx(0); setParams((p) => ({ ...p, ...it[0] })); setDimOff({}); }} altMetin="8 hazır takımla deneme">Örnek takımları yükle</MenuOge>
          </Menu>

          <Menu etiket="Dışa aktar" ikon="⬇ " birincil>
            <MenuOge onClick={() => { const s = svgAl(); if (s) pdfYazdir(s, `MİHENK - ${adAl}`); }} altMetin="Kağıt boyutunda, gerçek ölçek">PDF / Yazdır</MenuOge>
            <MenuOge onClick={() => { const s = svgAl(); if (s) pngIndir(s, `${adAl}.png`); }} altMetin="≈305 dpi">PNG resim</MenuOge>
            <MenuOge onClick={() => { const s = svgAl(); if (s) svgIndir(s, `${adAl}.svg`); }} altMetin="Vektör, mm ölçekli">SVG vektör</MenuOge>
            <MenuOge onClick={() => dosyaIndir(new Blob([generateDXF(params)], { type: "application/dxf" }), `${adAl}.dxf`)} altMetin="CAD için kontur ve eksen">DXF</MenuOge>
          </Menu>
          <input ref={csvGirdi} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={csvSec} />
        </div>

        {/* ── Toplu liste ── */}
        {batch.length > 0 && (
          <div className="toplu">
            <span className="sayac">TOPLU {batchIdx + 1} / {batch.length}</span>
            <button className="btn kucuk" disabled={batchIdx === 0} onClick={() => topluGit(Math.max(0, batchIdx - 1))} aria-label="Önceki takım">◀</button>
            <button className="btn kucuk" disabled={batchIdx >= batch.length - 1} onClick={() => topluGit(Math.min(batch.length - 1, batchIdx + 1))} aria-label="Sonraki takım">▶</button>
            <span className="ad">{params.toolName}</span>
            <button className="btn kucuk" onClick={async () => {
              for (let i = 0; i < batch.length; i++) {
                topluGit(i);
                await new Promise((r) => setTimeout(r, 500));
                const s = svgAl(); if (!s) continue;
                await pngIndir(s, `${dosyaAdi(batch[i]) || "takim-" + (i + 1)}.png`);
                await new Promise((r) => setTimeout(r, 200));
              }
            }}>Hepsini PNG indir</button>
            <button className="btn kucuk tehlike" onClick={() => { setBatch([]); setBatchIdx(0); }}>Listeyi kapat</button>
          </div>
        )}

        {/* ── Çizim alanı ── */}
        <div className="cad-area cizim-alani"
          style={{ cursor: cizimde && zoom > 1 ? "grab" : undefined }}
          onTouchStart={cizimde ? onTouchStart : undefined}
          onTouchMove={cizimde ? onTouchMove : undefined}
          onTouchEnd={cizimde ? onTouchEnd : undefined}
          onWheel={cizimde ? onWheel : undefined}
          onMouseDown={cizimde ? onMouseDown : undefined}
          onMouseMove={cizimde ? onMouseMove : undefined}
          onMouseUp={cizimde ? onMouseUp : undefined}
          onMouseLeave={cizimde ? onMouseUp : undefined}
        >
          {!cizimde ? <ThreeDView params={params} /> : (
            <>
              <Sayfa params={params} dimOff={dimOff} setDimOff={setDimOff} style={{
                flex: 1, display: "block", background: "transparent", borderRadius: 2, minWidth: 0,
                filter: "drop-shadow(0 6px 30px rgba(0,0,0,0.45))",
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center center",
                transition: zoom === 1 ? "transform 0.2s ease" : "none",
                touchAction: zoom > 1 ? "none" : "auto",
              }} />
              <div className="zoom-kutusu" role="group" aria-label="Yakınlaştırma">
                <button onClick={() => yakinlastir(1 / 1.25)} disabled={zoom <= ZOOM_MIN} aria-label="Uzaklaştır" title="Uzaklaştır">−</button>
                <span className="oran">{Math.round(zoom * 100)}%</span>
                <button onClick={() => yakinlastir(1.25)} disabled={zoom >= ZOOM_MAX} aria-label="Yakınlaştır" title="Yakınlaştır (Ctrl + tekerlek)">+</button>
                <button onClick={resetZoom} aria-label="Sayfaya sığdır" title="Sayfaya sığdır">⤢</button>
              </div>
              {isMobile && zoom <= 1.05 && <div className="ipucu-yuzen">İki parmakla yakınlaştır</div>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export { App };
