import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { TOOL_TYPES, DEFAULT_PARAMS } from "./constants";
import { Draggable } from "./drawing/Draggable";
import { SideView } from "./drawing/SideView";
import { EndView } from "./drawing/EndView";
import { BottomBlock } from "./drawing/BottomBlock";
import { Panel } from "./ui/Panel";
import { parseCSV, getInitialBatch } from "./io/csv";
import { ThreeDView } from "./view3d/ThreeDView";
import { downloadExcel, generateTemplateExcel, generateExcelReport } from "./io/excel";
import { generateDXF } from "./io/dxf";
import { LOGO_IMG, FILIGRAN_IMG } from "./assets/images";

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

  const svgW = 500;
  const svgH = 340;
  const da = { x: 8, y: 28, w: svgW - 16, h: svgH - 110 };

  const calc = useMemo(() => {
    const mxH = da.w * (view === "all" ? 0.58 : 0.85);
    const mxV = da.h * 0.55;
    const sc = Math.min(mxH / params.L, mxV / Math.max(params.D, params.d), 5);
    let t = "1:1";
    if (sc < 0.8) t = `1:${Math.round(1 / sc)}`;
    else if (sc > 1.5) t = `${Math.round(sc)}:1`;
    return { scale: sc, text: t };
  }, [params.L, params.D, params.d, view]);

  const endR = useMemo(() => Math.min(da.h * 0.32, 45), []);

  const sOx = view === "all" ? da.x + da.w * 0.32 : da.x + da.w * 0.5;
  const sOy = da.y + da.h * 0.42;
  const eCx = view === "all" ? da.x + da.w * 0.82 : da.x + da.w * 0.5;
  const eCy = da.y + da.h * 0.42;

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
            {[["all","TÜMÜ"],["side","YAN"],["end","UÇ"],["3d","3D"]].map(([v,lbl]) => (
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
            const svgEl = document.getElementById("teknik-svg");
            if (!svgEl) return;
            const clone = svgEl.cloneNode(true); clone.setAttribute("width","100%"); clone.setAttribute("height","auto");
            const svgData = new XMLSerializer().serializeToString(clone);
            const win = window.open("","_blank");
            win.document.write(`<!DOCTYPE html><html><head><title>MİHENK - ${params.toolName}</title><style>@page{size:A4 landscape;margin:8mm;}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;}svg{max-width:100%;height:auto;}</style></head><body>${svgData}</body></html>`);
            win.document.close(); setTimeout(() => win.print(), 500);
          }, "#1a4a28", "#1e6030")}

          {BTN(isMobile ? "💾" : "SVG", () => {
            const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
            const clone = svgEl.cloneNode(true); clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
            const blob = new Blob([new XMLSerializer().serializeToString(clone)], {type:"image/svg+xml"});
            const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download=`${params.toolName||"teknik-resim"}.svg`; a.click(); URL.revokeObjectURL(url);
          }, "#162040", "#1e3060")}

          {BTN(isMobile ? "🖼" : "PNG", () => {
            const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
            const clone = svgEl.cloneNode(true); clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
            const svgData = new XMLSerializer().serializeToString(clone);
            const canvas = document.createElement("canvas"); const vb = svgEl.viewBox.baseVal;
            canvas.width = vb.width*6; canvas.height = vb.height*6;
            const ctx = canvas.getContext("2d"); const img = new Image();
            img.onload = () => { ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); const a=document.createElement("a"); a.href=canvas.toDataURL("image/png"); a.download=`${params.toolName||"teknik-resim"}.png`; a.click(); };
            img.src = "data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData)));
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
                const clone = svgEl.cloneNode(true); clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
                const svgData = new XMLSerializer().serializeToString(clone);
                const canvas = document.createElement("canvas"); const vb = svgEl.viewBox.baseVal;
                canvas.width = vb.width * 6; canvas.height = vb.height * 6;
                const ctx = canvas.getContext("2d"); const img = new Image();
                await new Promise((resolve) => {
                  img.onload = () => { ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
                    const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `${batch[i].toolName || "takim-" + (i+1)}.png`; a.click(); resolve(); };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                });
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
          <svg id="teknik-svg" viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              flex: 1, display: "block", background: "transparent", borderRadius: 2,
              filter: "drop-shadow(0 6px 30px rgba(0,0,0,0.55))",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
              transition: zoom === 1 ? "transform 0.2s ease" : "none",
              touchAction: zoom > 1 ? "none" : "auto",
            }}>
              {(() => {
                // Helper: lighten/darken hex color
                const adj = (hex, amt) => {
                  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                  r = Math.min(255, Math.max(0, r + amt)); g = Math.min(255, Math.max(0, g + amt)); b = Math.min(255, Math.max(0, b + amt));
                  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
                };
                const cs = params.colShank, cn = params.colNeck, cc = params.colCut, cf = params.colFlute, ct = params.colTip;
                return (
                  <defs>
                    <linearGradient id="gShank" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={adj(cs, 30)} /><stop offset="18%" stopColor={adj(cs, 45)} />
                      <stop offset="40%" stopColor={adj(cs, 55)} /><stop offset="60%" stopColor={adj(cs, 35)} />
                      <stop offset="85%" stopColor={cs} /><stop offset="100%" stopColor={adj(cs, -30)} />
                    </linearGradient>
                    <linearGradient id="gNeck" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={adj(cn, 25)} /><stop offset="20%" stopColor={adj(cn, 45)} />
                      <stop offset="45%" stopColor={adj(cn, 55)} /><stop offset="65%" stopColor={adj(cn, 30)} />
                      <stop offset="100%" stopColor={adj(cn, -20)} />
                    </linearGradient>
                    <linearGradient id="gCut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cc} /><stop offset="15%" stopColor={adj(cc, 30)} />
                      <stop offset="35%" stopColor={adj(cc, 50)} /><stop offset="50%" stopColor={adj(cc, 60)} />
                      <stop offset="70%" stopColor={adj(cc, 25)} /><stop offset="100%" stopColor={adj(cc, -25)} />
                    </linearGradient>
                    <linearGradient id="gFlute" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cf} /><stop offset="50%" stopColor={adj(cf, 15)} />
                      <stop offset="100%" stopColor={adj(cf, -15)} />
                    </linearGradient>
                    <linearGradient id="gTip" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={ct} /><stop offset="100%" stopColor={adj(ct, 50)} />
                    </linearGradient>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="2" stroke="#bbb" strokeWidth="0.2" />
                    </pattern>
                    <filter id="shadow" x="-2%" y="-2%" width="104%" height="110%">
                      <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.15" />
                    </filter>
                    <radialGradient id="gEndOuter" cx="40%" cy="35%" r="60%">
                      <stop offset="0%" stopColor={adj(cc, 50)} /><stop offset="60%" stopColor={adj(cc, 20)} />
                      <stop offset="100%" stopColor={adj(cc, -10)} />
                    </radialGradient>
                    <radialGradient id="gEndLand" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={adj(cc, 35)} /><stop offset="100%" stopColor={adj(cc, -5)} />
                    </radialGradient>
                    {/* CAD grid pattern for SVG background */}
                    <pattern id="cadGridMinor" patternUnits="userSpaceOnUse" width="5" height="5">
                      <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(160,190,140,0.55)" strokeWidth="0.22"/>
                    </pattern>
                    <pattern id="cadGridMajor" patternUnits="userSpaceOnUse" width="25" height="25">
                      <rect width="25" height="25" fill="url(#cadGridMinor)"/>
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(130,165,110,0.72)" strokeWidth="0.38"/>
                    </pattern>
                  </defs>
                );
              })()}

              {/* Background: white + CAD grid */}
              {/* White base + grid in one pass — white rect must NOT cover grid */}
              <rect x={1} y={1} width={svgW - 2} height={svgH - 2} fill="#f8fafc" stroke="#b0c4d8" strokeWidth={0.4} />
              <rect x={1} y={1} width={svgW - 2} height={svgH - 2} fill="url(#cadGridMajor)" opacity={1} />

              {/* Watermark / Filigran — çapraz, büyük */}
              <image href={FILIGRAN_IMG} x={svgW / 2 - 200} y={svgH / 2 - 130} width={400} height={180}
                preserveAspectRatio="xMidYMid meet" opacity={0.20}
                style={{ mixBlendMode: "multiply" }}
                transform={`rotate(-25, ${svgW / 2}, ${svgH / 2 - 40})`} />

              <rect x={da.x} y={da.y} width={da.w} height={da.h} fill="none" stroke="#d8e4ee" strokeWidth={0.2} />

              {/* Header: logo left, title center */}
              <image href={LOGO_IMG} x={da.x + 4} y={1} width={200} height={25} preserveAspectRatio="xMinYMid meet" />
              <text x={svgW / 2} y={10} textAnchor="middle" fontSize={3.5} fontFamily="'IBM Plex Mono', monospace" fill="#3a6080" fontWeight="700" letterSpacing="1">MİHENK KESİCİ TAKIM</text>
              <text x={svgW / 2} y={17} textAnchor="middle" fontSize={2.5} fontFamily="'IBM Plex Mono', monospace" fill="#8aa0b8">{TOOL_TYPES[params.toolType]} — Teknik Resim</text>

              {(view === "all" || view === "side") && (
                <g>
                  <text x={sOx} y={da.y + 7} textAnchor="middle" fontSize={2.8} fontFamily="'IBM Plex Mono', monospace" fill="#7a95b0" fontWeight="600">YAN GÖRÜNÜM</text>
                  <SideView params={params} ox={sOx} oy={sOy} scale={calc.scale} dimOff={dimOff} setDimOff={setDimOff} />
                </g>
              )}

              {(view === "all" || view === "end") && (
                <g>
                  <text x={eCx} y={da.y + 7} textAnchor="middle" fontSize={2.8} fontFamily="'IBM Plex Mono', monospace" fill="#7a95b0" fontWeight="600">UÇTAN GÖRÜNÜM</text>
                  <EndView params={params} cx={eCx} cy={eCy} R={endR} />
                </g>
              )}

              {view === "all" && (
                <line x1={da.x + da.w * 0.67} y1={da.y + 2} x2={da.x + da.w * 0.67} y2={da.y + da.h - 2} stroke="#e0e0e0" strokeWidth={0.2} strokeDasharray="4,2" />
              )}

              {/* Unified Bottom Block — param table + title block */}
              <BottomBlock params={params} x={da.x + da.w * (1 - params.bbWidth / 100)} y={svgH - 92} w={da.w * (params.bbWidth / 100)} scaleText={calc.text} />

              {/* ── BALON NOTLARI ── */}
              {(params.notes || []).map((note, i) => {
                const nx = note.x || (da.x + 30 + i * 25);
                const ny = note.y || (da.y + da.h - 30);
                return (
                  <Draggable key={`note-${i}`} id={`note-${i}`} offsets={dimOff} setOffsets={setDimOff}>
                    <g>
                      <circle cx={nx} cy={ny} r={5} fill="#fff" stroke="#d32f2f" strokeWidth={0.5} />
                      <text x={nx} y={ny + 1.8} textAnchor="middle" fontSize={4} fontFamily="'IBM Plex Mono',monospace" fill="#d32f2f" fontWeight="800">{i + 1}</text>
                      <line x1={nx + 5} y1={ny} x2={nx + 12} y2={ny - 5} stroke="#d32f2f" strokeWidth={0.3} />
                      <text x={nx + 13} y={ny - 5} fontSize={3} fontFamily="'IBM Plex Mono',monospace" fill="#d32f2f" fontWeight="600">{note.text}</text>
                    </g>
                  </Draggable>
                );
              })}

              {/* ── ONAY DAMGASI — çizim alanı sol alt ── */}
              {params.stamp && (() => {
                const stampColors = {
                  "ONAYLANDI": "#1b7a2e", "TASLAK": "#b08a10", "REVİZYON": "#1565C0", "İPTAL": "#c62828"
                };
                const col = stampColors[params.stamp] || "#333";
                const cx = da.x + 50;
                const cy = da.y + da.h - 18;
                const stampDate = params.stampDate || new Date().toLocaleDateString("tr-TR");
                return (
                  <g transform={`rotate(-15, ${cx}, ${cy})`} opacity={0.8}>
                    <rect x={cx - 38} y={cy - 12} width={76} height={24} rx={2.5} ry={2.5}
                      fill="none" stroke={col} strokeWidth={1.3} strokeDasharray="2.5,1.2" />
                    <rect x={cx - 36} y={cy - 10} width={72} height={20} rx={1.5} ry={1.5}
                      fill="none" stroke={col} strokeWidth={0.5} />
                    <text x={cx} y={cy + 1} textAnchor="middle" fontSize={8.5} fontFamily="'Rajdhani','IBM Plex Mono',sans-serif"
                      fill={col} fontWeight="900" letterSpacing="1.5">{params.stamp}</text>
                    <text x={cx} y={cy + 8.5} textAnchor="middle" fontSize={3} fontFamily="'IBM Plex Mono',monospace"
                      fill={col} fontWeight="600">{stampDate}</text>
                  </g>
                );
              })()}
            </svg>
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
