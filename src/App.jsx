import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DEFAULT_PARAMS } from "./constants";
import { Sayfa, duzenHesapla } from "./drawing/Sayfa";
import { olcekYaz } from "./drawing/sayfaDuzeni";
import { Panel } from "./ui/Panel";
import { parseCSV, getInitialBatch } from "./io/csv";
import { ThreeDView } from "./view3d/ThreeDView";
import { downloadExcel, generateTemplateExcel, generateExcelReport } from "./io/excel";
import { generateDXF } from "./io/dxf";
import { svgIndir, pngIndir, pdfYazdir } from "./io/export";

function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [view, setView] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [dimOff, setDimOff] = useState({});
  const initBatch = useMemo(() => getInitialBatch(), []);
  const [batch, setBatch] = useState(initBatch);
  const [batchIdx, setBatchIdx] = useState(0);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const gestureRef = useRef({ lastDist: 0, lastPan: { x: 0, y: 0 }, startPan: { x: 0, y: 0 }, isPinching: false, isPanning: false });

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Touch handlers for pinch-zoom and pan
  const onTouchStart = useCallback((e) => {
    const g = gestureRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      g.lastDist = Math.sqrt(dx * dx + dy * dy);
      g.isPinching = true;
      g.isPanning = false;
    } else if (e.touches.length === 1 && zoom > 1) {
      g.startPan = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
      g.isPanning = true;
      g.isPinching = false;
    }
  }, [zoom, pan]);

  const onTouchMove = useCallback((e) => {
    const g = gestureRef.current;
    if (g.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (g.lastDist > 0) {
        const scale = dist / g.lastDist;
        setZoom(z => Math.max(1, Math.min(5, z * scale)));
      }
      g.lastDist = dist;
    } else if (g.isPanning && e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      setPan({ x: e.touches[0].clientX - g.startPan.x, y: e.touches[0].clientY - g.startPan.y });
    }
  }, [zoom]);

  const onTouchEnd = useCallback(() => {
    gestureRef.current.isPinching = false;
    gestureRef.current.isPanning = false;
    gestureRef.current.lastDist = 0;
  }, []);

  // Mouse wheel zoom (desktop)
  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.max(1, Math.min(5, z - e.deltaY * 0.003)));
    }
  }, []);

  // Reset zoom on view change
  useEffect(() => { resetZoom(); }, [view]);

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
  const calc = { text: olcekYaz(duzen.yan.olcek), kagit: duzen.kagit.ad };

  const BTN = (label, onClick, color, hov) => (
    <button onClick={onClick} style={{ background: color, border: "none", borderRadius: 3, padding: isMobile ? "5px 8px" : "4px 13px", color: "#fff", fontSize: isMobile ? 10 : 10.5, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 600, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 3 }}
      onMouseOver={(e) => e.currentTarget.style.background = hov}
      onMouseOut={(e) => e.currentTarget.style.background = color}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--mono)", background: "var(--bg-base)" }}>

      {!isMobile && <Panel params={params} setParams={setParams} isMobile={false} showPanel={true} onClose={() => {}} />}
      {isMobile && <Panel params={params} setParams={setParams} isMobile={true} showPanel={showPanel} onClose={() => setShowPanel(false)} />}

      {isMobile && showPanel && (
        <div onClick={() => setShowPanel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999 }} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── TOOLBAR ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: isMobile ? 3 : 5,
          padding: isMobile ? "4px 8px" : "5px 12px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-mid)",
          flexWrap: "nowrap",
          flexShrink: 0,
        }}>
          {/* Accent left stripe */}
          <div style={{ position: "absolute", left: isMobile ? 0 : "var(--panel-w)", top: 0, width: 0, height: 0 }} />

          {isMobile && (
            <button onClick={() => setShowPanel(true)} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hi)", borderRadius: 3, padding: "5px 9px", color: "var(--text-hi)", fontSize: 14, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>☰</button>
          )}

          {/* View toggle — CAD style segmented */}
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-hi)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
            {[["all","ÇİZİM"],["3d","3D"]].map(([v,lbl]) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "var(--accent)" : "transparent",
                border: "none",
                borderRight: v !== "3d" ? "1px solid var(--border-hi)" : "none",
                padding: isMobile ? "4px 8px" : "4px 14px",
                color: view === v ? "#fff" : "var(--text-mid)",
                fontSize: isMobile ? 9 : 9.5, cursor: "pointer", fontFamily: "var(--mono)",
                fontWeight: 700, letterSpacing: 1.5, transition: "background 0.12s",
              }}>{lbl}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Status readout — desktop only */}
          {!isMobile && (
            <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--mono)", letterSpacing: 0.5, marginRight: 4, whiteSpace: "nowrap" }}>
              <span style={{ color: "var(--text-mid)" }}>{calc.text}</span>
              {" "}·{" "}
              <span style={{ color: "var(--accent2)" }}>⌀{params.D}×{params.L}mm</span>
              {" "}·{" "}{params.z}Z{" "}Helis{" "}{params.helix}°
              {params.l2 > 0 ? <span style={{ color: "var(--text-lo)" }}>{" "}· Boğaz ⌀{params.neckDia}×{params.l2}mm@{params.neckAngle}°</span> : ""}
            </div>
          )}

          {/* Export buttons — unified style */}
          {BTN(isMobile ? "📄" : "PDF", () => {
            const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
            pdfYazdir(svgEl, `MİHENK - ${params.toolName}`);
          }, "#1a4a28", "#1e6030")}

          {BTN(isMobile ? "💾" : "SVG", () => {
            const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
            svgIndir(svgEl, `${params.toolName || "teknik-resim"}.svg`);
          }, "#162040", "#1e3060")}

          {BTN(isMobile ? "🖼" : "PNG", () => {
            const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
            pngIndir(svgEl, `${params.toolName || "teknik-resim"}.png`);
          }, "#3a1a08", "#5a2a0a")}

          {BTN(isMobile ? "↺" : "↺ Sıfırla", () => setDimOff({}), "var(--bg-surface)", "var(--bg-raised)")}

          {/* DXF Export */}
          {BTN(isMobile ? "⬡" : "DXF", () => {
            const dxf = generateDXF(params);
            const blob = new Blob([dxf], { type: "application/dxf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `${params.toolName || "teknik-resim"}.dxf`; a.click();
            URL.revokeObjectURL(url);
          }, "#4a1a4a", "#6a2a6a")}

          {/* CSV Import */}
          {BTN(isMobile ? "📥" : "CSV İçe", () => document.getElementById("csv-import").click(), "#0a3a5a", "#0e4a6a")}
          <input id="csv-import" type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={(e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const items = parseCSV(ev.target.result);
              if (items.length > 0) { setBatch(items); setBatchIdx(0); setParams(p => ({ ...p, ...items[0] })); }
              else alert("CSV dosyası okunamadı veya boş.");
            };
            reader.readAsText(file, "UTF-8");
            e.target.value = "";
          }} />

          {/* Şablon İndir */}
          {BTN(isMobile ? "📋" : "Şablon", () => {
            downloadExcel(generateTemplateExcel(), "mihenk-takim-sablonu.xls");
          }, "#2a2a2a", "#3a3a3a")}

          {/* Excel Rapor */}
          {BTN(isMobile ? "📊" : "Rapor", () => {
            const lib = (() => { try { return JSON.parse(localStorage.getItem("mihenk-lib") || "[]"); } catch { return []; } })();
            const html = generateExcelReport(batch, lib);
            if (!html) { alert("Rapor için toplu liste veya kütüphanede kayıt olmalı."); return; }
            downloadExcel(html, `mihenk-rapor-${new Date().toISOString().slice(0,10)}.xls`);
          }, "#1a3a1a", "#2a4a2a")}

        </div>

        {/* ── BATCH NAVIGATION BAR ── */}
        {batch.length > 1 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px", background: "linear-gradient(90deg, rgba(58,143,212,0.12), rgba(232,146,42,0.08))",
            borderBottom: "1px solid var(--border-mid)", flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, color: "var(--accent2)", fontFamily: "var(--mono)", fontWeight: 700 }}>
              TOPLU: {batchIdx + 1} / {batch.length}
            </span>
            <button onClick={() => { const i = Math.max(0, batchIdx - 1); setBatchIdx(i); setParams(p => ({ ...p, ...batch[i] })); setDimOff({}); }}
              disabled={batchIdx === 0}
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hi)", borderRadius: 3, padding: "2px 10px", color: batchIdx === 0 ? "var(--text-lo)" : "var(--text-hi)", fontSize: 11, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700 }}>◀</button>
            <button onClick={() => { const i = Math.min(batch.length - 1, batchIdx + 1); setBatchIdx(i); setParams(p => ({ ...p, ...batch[i] })); setDimOff({}); }}
              disabled={batchIdx >= batch.length - 1}
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hi)", borderRadius: 3, padding: "2px 10px", color: batchIdx >= batch.length - 1 ? "var(--text-lo)" : "var(--text-hi)", fontSize: 11, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700 }}>▶</button>
            <span style={{ fontSize: 9, color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {params.toolName}
            </span>
            {/* Toplu PNG Export */}
            <button onClick={async () => {
              for (let i = 0; i < batch.length; i++) {
                setBatchIdx(i); setParams(p => ({ ...p, ...batch[i] })); setDimOff({});
                await new Promise(r => setTimeout(r, 400));
                const svgEl = document.getElementById("teknik-svg"); if (!svgEl) continue;
                await pngIndir(svgEl, `${batch[i].toolName || "takim-" + (i+1)}.png`);
                await new Promise(r => setTimeout(r, 200));
              }
            }}
              style={{ background: "#3a1a08", border: "none", borderRadius: 3, padding: "3px 10px", color: "#fff", fontSize: 9, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: 0.5 }}>
              TOPLU PNG
            </button>
            <button onClick={() => { setBatch([]); setBatchIdx(0); }}
              style={{ background: "transparent", border: "1px solid var(--red)", borderRadius: 3, padding: "2px 8px", color: "var(--red)", fontSize: 9, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── DRAWING AREA ── */}
        <div className="cad-area" style={{ flex: 1, display: "flex", padding: isMobile ? 4 : 8, overflow: "hidden", position: "relative" }}
          onTouchStart={view !== "3d" ? onTouchStart : undefined}
          onTouchMove={view !== "3d" ? onTouchMove : undefined}
          onTouchEnd={view !== "3d" ? onTouchEnd : undefined}
          onWheel={view !== "3d" ? onWheel : undefined}
        >
          {view === "3d" ? (
            <ThreeDView params={params} />
          ) : (<>
          <Sayfa params={params} dimOff={dimOff} setDimOff={setDimOff} style={{
            flex: 1, display: "block", background: "transparent", borderRadius: 2,
            filter: "drop-shadow(0 6px 30px rgba(0,0,0,0.55))",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: zoom === 1 ? "transform 0.2s ease" : "none",
            touchAction: zoom > 1 ? "none" : "auto",
          }} />
          {/* Zoom indicator */}
          {zoom > 1.05 && (
            <div style={{
              position: "absolute", bottom: isMobile ? 10 : 14, right: isMobile ? 10 : 14,
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <span style={{
                background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 11, fontFamily: "var(--mono)",
                fontWeight: 700, padding: "4px 10px", borderRadius: 4,
              }}>{Math.round(zoom * 100)}%</span>
              <button onClick={resetZoom} style={{
                background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 4,
                padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer",
                fontFamily: "var(--mono)", fontWeight: 600,
              }}>✕ Sıfırla</button>
            </div>
          )}
          {isMobile && zoom <= 1.05 && (
            <div style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.45)", color: "#ccc", fontSize: 9, fontFamily: "var(--mono)",
              padding: "3px 10px", borderRadius: 10, pointerEvents: "none", whiteSpace: "nowrap",
            }}>İki parmakla yakınlaştır</div>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}

export { App };
