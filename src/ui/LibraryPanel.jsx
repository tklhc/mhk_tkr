import { useState } from "react";

// ─── TOOL LIBRARY PANEL ─────────────────────────────────
function LibraryPanel({ params, setParams, INP }) {
  const SB = { padding: "9px 12px 11px 14px", background: "var(--bg-raised)", borderLeft: "2px solid var(--accent)", borderBottom: "1px solid var(--border-dim)" };
  const getLib = () => { try { return JSON.parse(localStorage.getItem("mihenk-lib") || "[]"); } catch { return []; } };
  const [lib, setLib] = useState(getLib);
  const [search, setSearch] = useState("");
  const saveLib = (newLib) => { localStorage.setItem("mihenk-lib", JSON.stringify(newLib)); setLib(newLib); };
  const filtered = search ? lib.filter(t => (t.toolName||"").toLowerCase().includes(search.toLowerCase()) || (t.material||"").toLowerCase().includes(search.toLowerCase())) : lib;

  return (
    <div style={SB}>
      <button onClick={() => {
        const name = params.toolName || "İsimsiz";
        const idx = lib.findIndex(t => t.toolName === name);
        let nl; if (idx >= 0) { nl = [...lib]; nl[idx] = { ...params, savedAt: new Date().toISOString() }; } else { nl = [...lib, { ...params, savedAt: new Date().toISOString() }]; }
        saveLib(nl);
      }}
        style={{ width: "100%", background: "var(--accent)", border: "none", borderRadius: 3, padding: "6px 0", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700, marginBottom: 6 }}>
        💾 "{params.toolName}" KAYDET
      </button>
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Takım ara..." style={{ ...INP, fontSize: 10, marginBottom: 6 }} />
      <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)", marginBottom: 4 }}>{lib.length} takım kayıtlı</div>
      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {filtered.length === 0 && <div style={{ fontSize: 9, color: "var(--text-lo)", fontFamily: "var(--mono)", padding: 8, textAlign: "center" }}>{lib.length === 0 ? "Henüz kayıt yok" : "Sonuç bulunamadı"}</div>}
        {filtered.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", marginBottom: 2, background: "var(--bg-input)", borderRadius: 3, border: "1px solid var(--border-dim)", cursor: "pointer" }}
            onClick={() => setParams(p => ({ ...p, ...t }))}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: "var(--text-hi)", fontFamily: "var(--mono)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.toolName}</div>
              <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)" }}>⌀{t.D}×{t.L} · {t.z}Z · {t.material}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); const nl = lib.filter((_, j) => j !== i); saveLib(nl); }}
              style={{ background: "transparent", border: "none", color: "var(--red)", fontSize: 11, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
      {lib.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-dim)", marginTop: 6, paddingTop: 6, display: "flex", gap: 4 }}>
          <button onClick={() => { const b = new Blob(["\uFEFF" + JSON.stringify(lib, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "mihenk-kutuphane.json"; a.click(); }}
            style={{ flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-mid)", borderRadius: 3, padding: "4px 0", color: "var(--text-mid)", fontSize: 8.5, cursor: "pointer", fontFamily: "var(--mono)" }}>📤 Dışa Aktar</button>
          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".json"; inp.onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (Array.isArray(d)) saveLib([...lib, ...d]); } catch {} }; r.readAsText(f); }; inp.click(); }}
            style={{ flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-mid)", borderRadius: 3, padding: "4px 0", color: "var(--text-mid)", fontSize: 8.5, cursor: "pointer", fontFamily: "var(--mono)" }}>📥 İçe Aktar</button>
        </div>
      )}
    </div>
  );
}

export { LibraryPanel };
