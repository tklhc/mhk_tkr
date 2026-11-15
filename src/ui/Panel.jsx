import { useState, useCallback } from "react";
import { TOOL_TYPES, TIP_VARSAYILAN } from "../constants";
import { NI, TolInput, NIT } from "./inputs";
import { LibraryPanel } from "./LibraryPanel";
import { LOGO_IMG } from "../assets/images";
import { takimProfili } from "../geometry/profil";
import { OLCEKLER, olcekYaz } from "../drawing/sayfaDuzeni";

function Panel({ params, setParams, isMobile, showPanel, onClose }) {
  const u = useCallback((k, v) => setParams((p) => ({ ...p, [k]: v })), [setParams]);
  const [openSec, setOpenSec] = useState({ geo: true, cool: false, show: false, page: true, doc: false, notes: false, cust: false, lib: false, step: true, shank: false });
  const hatalar = takimProfili(params).hatalar;
  const togSec = useCallback((k) => setOpenSec((s) => ({ ...s, [k]: !s[k] })), []);

  const SH = (label, key, icon = "▸") => {
    const open = openSec[key];
    return (
      <div onClick={() => togSec(key)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 12px 6px 10px", cursor: "pointer", userSelect: "none",
        background: open ? "var(--bg-raised)" : "transparent",
        borderLeft: open ? "2px solid var(--accent)" : "2px solid transparent",
        borderBottom: "1px solid var(--border-dim)",
        transition: "background 0.12s",
      }}
        onMouseOver={(e) => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
        onMouseOut={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: open ? "var(--accent)" : "var(--text-lo)", fontFamily: "var(--mono)" }}>{icon}</span>
          <span style={{
            fontSize: 8.5, fontWeight: 700,
            color: open ? "var(--accent)" : "var(--text-mid)",
            textTransform: "uppercase", letterSpacing: 2, fontFamily: "var(--mono)",
          }}>{label}</span>
        </div>
        <span style={{
          fontSize: 7, color: open ? "var(--accent)" : "var(--text-lo)",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          display: "inline-block", transition: "transform 0.18s",
        }}>▶</span>
      </div>
    );
  };

  const SB = { padding: "9px 12px 11px 14px", background: "var(--bg-raised)", borderLeft: "2px solid var(--accent)", borderBottom: "1px solid var(--border-dim)" };
  const INP = { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-mid)", borderRadius: 3, padding: "4px 7px", color: "var(--text-hi)", fontSize: 11, fontFamily: "var(--mono)", boxSizing: "border-box" };
  const LBL = { fontSize: 8, color: "var(--text-label)", display: "block", marginBottom: 3, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: 1.5 };

  return (
    <div style={{
      width: isMobile ? "85vw" : "var(--panel-w)",
      maxWidth: isMobile ? 360 : "var(--panel-w)",
      background: "var(--bg-panel)",
      borderRight: "1px solid var(--border-mid)",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      ...(isMobile ? {
        position: "fixed", left: showPanel ? 0 : "-100%", top: 0,
        zIndex: 1000, transition: "left 0.26s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: showPanel ? "8px 0 40px rgba(0,0,0,0.85)" : "none",
      } : {}),
    }}>

      {/* ── HEADER ── */}
      <div style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border-mid)", flexShrink: 0 }}>
        {/* Accent stripe */}
        <div style={{ height: 2, background: "linear-gradient(90deg,var(--accent) 0%,var(--accent2) 55%,transparent 100%)" }} />
        <div style={{ padding: "10px 14px 9px" }}>
          {isMobile && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--mono)", letterSpacing: 2 }}>MİHENK</span>
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--border-hi)", borderRadius: 3, padding: "2px 8px", color: "var(--text-mid)", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
            <img src={LOGO_IMG} style={{ width: 36, height: 14, objectFit: "contain", opacity: 0.9 }} alt="MİHENK" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-hi)", letterSpacing: 2, fontFamily: "var(--display)", lineHeight: 1 }}>TEKNİK RESİM</div>
              <div style={{ fontSize: 7.5, color: "var(--accent)", fontFamily: "var(--mono)", letterSpacing: 2.5, marginTop: 2, opacity: 0.85 }}>KESİCİ TAKIM SİSTEMİ</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 7.5, fontFamily: "var(--mono)", color: "var(--text-lo)", background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: 2, padding: "1px 6px", letterSpacing: 1 }}>v2.0</span>
            <span style={{ fontSize: 7.5, fontFamily: "var(--mono)", color: "var(--accent2)", background: "rgba(58,143,212,0.06)", border: "1px solid rgba(58,143,212,0.20)", borderRadius: 2, padding: "1px 6px", letterSpacing: 0.8 }}>⌀{params.D}×{params.L}mm · {params.z}Z</span>
          </div>
        </div>
      </div>

      {/* ── TAKIM TİPİ (always visible) ── */}
      <div style={{ padding: "8px 12px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-mid)", flexShrink: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 5, fontFamily: "var(--mono)" }}>▸ TAKIM TİPİ</div>
        <select value={params.toolType} onChange={(e) => { const v = e.target.value; setParams((p) => ({ ...p, toolType: v, ...(TIP_VARSAYILAN[v] ? TIP_VARSAYILAN[v](p) : {}) })); }}
          style={{ ...INP, fontSize: 11.5, padding: "5px 8px", fontWeight: 600, color: "var(--accent)" }}>
          {Object.entries(TOOL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* ── GEOMETRİ UYARILARI ── */}
      {hatalar.length > 0 && (
        <div style={{ padding: "6px 12px", background: "rgba(204,68,68,0.10)", borderBottom: "1px solid var(--red)", flexShrink: 0 }}>
          {hatalar.map((h, i) => (
            <div key={i} style={{ fontSize: 9, color: "#e08a8a", fontFamily: "var(--mono)", lineHeight: 1.35, marginBottom: i < hatalar.length - 1 ? 3 : 0 }}>⚠ {h.mesaj}</div>
          ))}
        </div>
      )}

      {/* ── SCROLLABLE BODY ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ANA BOYUTLAR */}
        <div style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <div style={{ padding: "5px 12px 5px 12px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-dim)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 2, fontFamily: "var(--mono)" }}>▸ ANA BOYUTLAR</span>
            <span style={{ fontSize: 7.5, color: "var(--text-lo)", fontFamily: "var(--mono)", letterSpacing: 1 }}>+ TOLERANS</span>
          </div>
          <div style={SB}>
            {params.toolType !== "stepdrill" && (
              <NIT label="Çap (D)" value={params.D} onChange={(v) => u("D", v)} min={0.5} max={100} step={0.5} tolVal={params.tolD} onTolChange={(v) => u("tolD", v)} />
            )}
            <NIT label="Sap Çapı (d)" value={params.d} onChange={(v) => u("d", v)} min={0.5} max={100} step={0.5} tolVal={params.told} onTolChange={(v) => u("told", v)} />
            <NIT label="Toplam Boy" value={params.L} onChange={(v) => u("L", v)} min={5} max={500} tolVal={params.tolL} onTolChange={(v) => u("tolL", v)} />
            {params.toolType !== "stepdrill" && (
              <NIT label="Kesici Boy" value={params.l1} onChange={(v) => u("l1", v)} min={1} max={300} step={0.5} tolVal={params.toll1} onTolChange={(v) => u("toll1", v)} />
            )}
            {params.toolType !== "stepdrill" && (
              <>
                <NIT label="Boğaz (l₂)" value={params.l2} onChange={(v) => u("l2", v)} min={0} max={200} step={0.5} tolVal={params.toll2} onTolChange={(v) => u("toll2", v)} />
                {params.l2 > 0 && <NIT label="Boğaz Çapı" value={params.neckDia} onChange={(v) => u("neckDia", v)} min={0.5} max={params.d} step={0.1} tolVal={params.tolNeck} onTolChange={(v) => u("tolNeck", v)} />}
                {params.l2 > 0 && <NI label="Geçiş Açısı" value={params.neckAngle} onChange={(v) => u("neckAngle", v)} min={10} max={90} step={5} unit="°" />}
              </>
            )}
            {params.toolType === "stepdrill" && (
              <div style={{ fontSize: 9, color: "var(--text-lo)", fontStyle: "italic", fontFamily: "var(--mono)", marginTop: 2 }}>Kesici boy ve çaplar kademelerden hesaplanır</div>
            )}
          </div>
        </div>

        {/* GEOMETRİ */}
        {SH("Geometri", "geo", "⟳")}
        {openSec.geo && <div style={SB}>
          <NI label="Diş Sayısı (z)" value={params.z} onChange={(v) => u("z", v)} min={1} max={16} unit="Z" />
          <NI label="Helis Açısı" value={params.helix} onChange={(v) => u("helix", v)} min={0} max={60} unit="°" />
          <NI label="Çekirdek (dc)" value={params.dCore} onChange={(v) => u("dCore", v)} min={0} max={params.D} step={0.1} />
          {params.toolType === "drill" && <NI label="Uç Açısı" value={params.pointAngle} onChange={(v) => u("pointAngle", v)} min={60} max={180} step={1} unit="°" />}
          <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
            {[["helixHand","Helis Yönü"],["cutDir","Kesim Yönü"]].map(([k,lbl]) => (
              <div key={k} style={{ flex: 1 }}>
                <label style={LBL}>{lbl}</label>
                <select value={params[k]} onChange={(e) => u(k, e.target.value)}
                  style={{ width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-mid)", borderRadius: 3, padding: "3px 5px", color: "var(--text-hi)", fontSize: 11, fontFamily: "var(--mono)" }}>
                  <option value="Sağ">Sağ</option><option value="Sol">Sol</option>
                </select>
              </div>
            ))}
          </div>
          {params.toolType === "bullnose" && <NI label="Köşe R" value={params.rCorner} onChange={(v) => u("rCorner", v)} min={0} max={params.D/2} step={0.1} />}
          {params.toolType === "taperreamer" && <NIT label="Uç Çapı" value={params.tipD} onChange={(v) => u("tipD", v)} min={0.1} max={params.D} step={0.01} tolVal={params.tolTip} onTolChange={(v) => u("tolTip", v)} />}
          {(params.toolType === "chamfer" || params.toolType === "reamer") && <NI label={params.toolType === "reamer" ? "Giriş Pahı" : "Pah Boyu"} value={params.chamferSize} onChange={(v) => u("chamferSize", v)} min={0} max={params.D/2} step={0.1} />}
        </div>}

        {/* KADEMELER */}
        {params.toolType === "stepdrill" && <>
          {SH("Kademeler", "step", "◈")}
          {openSec.step && <div style={SB}>
            {(params.steps || []).map((st, idx) => (
              <div key={idx} style={{ marginBottom: 7, padding: "6px 7px", background: "var(--bg-input)", borderRadius: 3, border: "1px solid var(--border-mid)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 8.5, color: "var(--accent)", fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: 1.5 }}>KD-{idx + 1}</span>
                  {(params.steps || []).length > 1 && (
                    <button onClick={() => setParams(p => ({ ...p, steps: p.steps.filter((_,i) => i !== idx) }))}
                      style={{ background: "transparent", border: "1px solid var(--red)", borderRadius: 2, padding: "1px 6px", color: "var(--red)", fontSize: 8, cursor: "pointer", fontFamily: "var(--mono)" }}>SİL</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                  {[["dia","⌀ ÇAP",0.1,0.5],["len","BOY",0.5,0.5],["angle","AÇI°",1,30]].map(([fld,lbl,stp,mn]) => (
                    <div key={fld} style={{ flex: 1 }}>
                      <label style={LBL}>{lbl}</label>
                      <input type="number" value={st[fld]} step={stp} min={mn}
                        onChange={(ev) => { const v = parseFloat(ev.target.value)||0; setParams(p => ({...p, steps: p.steps.map((s,i) => i===idx ? {...s,[fld]:v} : s)})); }}
                        style={{ width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border-mid)", borderRadius: 3, padding: "3px 4px", color: "var(--text-hi)", fontSize: 11, fontFamily: "var(--mono)", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["tolDia","TOL ÇAP"],["tolLen","TOL BOY"]].map(([fld,lbl]) => (
                    <div key={fld} style={{ flex: 1 }}>
                      <label style={LBL}>{lbl}</label>
                      <TolInput value={st[fld]||""} onChange={(v) => setParams(p => ({...p, steps: p.steps.map((s,i) => i===idx ? {...s,[fld]:v} : s)}))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => { const last=(params.steps||[]).slice(-1)[0]; setParams(p => ({...p, steps: [...(p.steps||[]), {dia: last?last.dia+2:params.D, len:15, angle:90, tolDia:"", tolLen:""}]})); }}
              style={{ width: "100%", background: "transparent", border: "1px dashed var(--border-hi)", borderRadius: 3, padding: "5px 0", color: "var(--accent)", fontSize: 8.5, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              + KADEME EKLE
            </button>
          </div>}
        </>}

        {/* SOĞUTMA */}
        {SH("Soğutma", "cool", "⬡")}
        {openSec.cool && <div style={SB}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <label style={{ fontSize: 10.5, color: "var(--text-mid)", fontFamily: "var(--mono)" }}>Soğutma Deliği</label>
            <input type="checkbox" checked={params.coolantHole} onChange={(e) => u("coolantHole", e.target.checked)} style={{ accentColor: "var(--accent)", width: 14, height: 14 }} />
          </div>
          {params.coolantHole && <NI label="Delik Sayısı" value={params.coolantCount} onChange={(v) => u("coolantCount", v)} min={1} max={8} unit="ad" />}
        </div>}


        {/* RESİMDE GÖSTER */}
        {SH("Resimde Göster", "show", "◎")}
        {openSec.show && <div style={SB}>
          {[["showDimD","⌀D Kesici Çap"],["showDimd","⌀d Sap Çapı"],["showDimL","L Toplam Boy"],["showDiml1","l₁ Kesici Boy"],["showDiml2","l₂ Boğaz Boyu"],["showDimNeck","⌀ Boğaz Çapı"],["showDimHelix","Helis Açısı"],["showDimAngles","Açılar / R"]].map(([key,lbl]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, cursor: "pointer" }} onClick={() => u(key, !params[key])}>
              <div style={{ width: 13, height: 13, borderRadius: 2, flexShrink: 0, background: params[key] ? "var(--accent)" : "transparent", border: `1px solid ${params[key] ? "var(--accent)" : "var(--border-hi)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {params[key] && <span style={{ fontSize: 8, color: "#000", fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <label style={{ fontSize: 10, color: params[key] ? "var(--text-hi)" : "var(--text-mid)", fontFamily: "var(--mono)", cursor: "pointer" }}>{lbl}</label>
            </div>
          ))}
        </div>}

        {/* SAP */}
        {SH("Sap Detayı", "shank", "▤")}
        {openSec.shank && <div style={SB}>
          <label style={LBL}>Sap Tipi (DIN 6535)</label>
          <select value={params.sapTipi || "HA"} onChange={(e) => u("sapTipi", e.target.value)} style={{ ...INP, marginBottom: 6 }}>
            <option value="HA">HA — Düz sap</option>
            <option value="HB">HB — Weldon düzlüğü</option>
            <option value="HE">HE — Whistle Notch</option>
          </select>
          {params.sapTipi && params.sapTipi !== "HA" && <>
            <NI label="Düzlük Boyu" value={params.sapDuzUzunluk || 0} onChange={(v) => u("sapDuzUzunluk", v)} min={0} max={200} step={0.5} />
            <NI label="Derinlik (t)" value={params.sapDuzDerinlik || 0} onChange={(v) => u("sapDuzDerinlik", v)} min={0} max={20} step={0.1} />
            <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)", lineHeight: 1.4 }}>
              0 = otomatik (boy ≈ 2·d, derinlik ≈ 0,1·d). Otomatik değerler yaklaşıktır; standart tablosundan teyit edin.
            </div>
          </>}
        </div>}

        {/* SAYFA */}
        {SH("Sayfa", "page", "▭")}
        {openSec.page && <div style={SB}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={LBL}>Kağıt</label>
              <select value={params.kagit} onChange={(e) => u("kagit", e.target.value)} style={{ ...INP }}>
                <option value="A4">A4 (297×210)</option><option value="A3">A3 (420×297)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={LBL}>Ölçek</label>
              <select value={params.olcek} onChange={(e) => u("olcek", e.target.value)} style={{ ...INP }}>
                <option value="otomatik">Otomatik</option>
                {OLCEKLER.map((o) => <option key={o} value={olcekYaz(o)}>{olcekYaz(o)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={LBL}>Genel Tolerans</label>
            <input type="text" value={params.genelTolerans} onChange={(e) => u("genelTolerans", e.target.value)} style={INP} />
          </div>
          <div>
            <label style={LBL}>Tarih</label>
            <input type="date" value={params.tarih || ""} onChange={(e) => u("tarih", e.target.value)} style={{ ...INP, fontSize: 10.5 }} />
            <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)", marginTop: 2 }}>Boşsa bugünün tarihi yazılır</div>
          </div>
        </div>}

        {/* DOKÜMAN */}
        {SH("Doküman Bilgileri", "doc", "☰")}
        {openSec.doc && <div style={SB}>
          <div style={{ marginBottom: 5 }}>
            <label style={LBL}>Alet Adı</label>
            <input type="text" value={params.toolName} onChange={(e) => u("toolName", e.target.value)} style={INP} />
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            {[["material","Malzeme"],["coating","Kaplama"]].map(([k,l]) => (
              <div key={k} style={{ flex: 1 }}><label style={LBL}>{l}</label><input type="text" value={params[k]} onChange={(e) => u(k,e.target.value)} style={{...INP}} /></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
            {[["drawingNo","Çizim No"],["revision","Revizyon"]].map(([k,l]) => (
              <div key={k} style={{ flex: 1 }}><label style={LBL}>{l}</label><input type="text" value={params[k]} onChange={(e) => u(k,e.target.value)} style={{...INP}} /></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ flex: 1 }}><label style={LBL}>Çizen</label><input type="text" value={params.createdBy} onChange={(e) => u("createdBy",e.target.value)} placeholder="Varsayılan: firma ayarı" style={INP} /></div>
            <div style={{ flex: 1 }}><label style={LBL}>Onaylayan</label><input type="text" value={params.approvedBy || ""} onChange={(e) => u("approvedBy",e.target.value)} style={INP} /></div>
          </div>

                  </div>}

        {/* NOTLAR (Balon) */}
        {SH("Notlar", "notes", "◉")}
        {openSec.notes && <div style={SB}>
          <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)", marginBottom: 5 }}>Çizim üzerine numaralı not balonları ekle. Sürükle ile taşı.</div>
          {(params.notes || []).map((note, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#d32f2f", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--mono)" }}>{i + 1}</span>
              <input type="text" value={note.text} onChange={(e) => { const v = e.target.value; setParams(p => ({ ...p, notes: p.notes.map((n, j) => j === i ? { ...n, text: v } : n) })); }}
                placeholder="Not yazın..." style={{ ...INP, flex: 1, fontSize: 10 }} />
              <button onClick={() => setParams(p => ({ ...p, notes: p.notes.filter((_, j) => j !== i) }))}
                style={{ background: "transparent", border: "1px solid var(--red)", borderRadius: 2, padding: "1px 5px", color: "var(--red)", fontSize: 9, cursor: "pointer", fontFamily: "var(--mono)", flexShrink: 0 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setParams(p => ({ ...p, notes: [...(p.notes || []), { text: "Not " + ((p.notes || []).length + 1) }] }))}
            style={{ width: "100%", background: "transparent", border: "1px dashed var(--border-hi)", borderRadius: 3, padding: "5px 0", color: "var(--accent)", fontSize: 9, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: 1 }}>
            + NOT EKLE
          </button>
        </div>}

        {/* MÜŞTERİ & ONAY */}
        {SH("Müşteri & Onay", "cust", "✦")}
        {openSec.cust && <div style={SB}>
          {/* Müşteri modu toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }} onClick={() => u("customerMode", !params.customerMode)}>
            <div style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0, background: params.customerMode ? "var(--accent)" : "transparent", border: `1px solid ${params.customerMode ? "var(--accent)" : "var(--border-hi)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {params.customerMode && <span style={{ fontSize: 9, color: "#000", fontWeight: 900 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: params.customerMode ? "var(--text-hi)" : "var(--text-mid)", fontFamily: "var(--mono)", cursor: "pointer", fontWeight: 600 }}>Müşteri Modu</div>
              <div style={{ fontSize: 8, color: "var(--text-lo)", fontFamily: "var(--mono)" }}>İç detayları (tel, e-posta) gizler</div>
            </div>
          </div>

          {/* Müşteri/Sipariş bilgileri */}
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: 7, marginBottom: 6 }}>
            <div style={{ marginBottom: 5 }}>
              <label style={LBL}>Müşteri Adı</label>
              <input type="text" value={params.customerName||""} onChange={(e) => u("customerName", e.target.value)} placeholder="ör: ABC Makina" style={INP} />
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Sipariş No</label>
                <input type="text" value={params.orderNo||""} onChange={(e) => u("orderNo", e.target.value)} placeholder="ör: SIP-2026-001" style={INP} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Teslim Tarihi</label>
                <input type="date" value={params.deliveryDate||""} onChange={(e) => u("deliveryDate", e.target.value)} style={{...INP, fontSize: 10}} />
              </div>
            </div>
          </div>

          {/* Onay Damgası */}
          <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: 7 }}>
            <label style={LBL}>Onay Damgası</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
              {[
                {l: "Yok", v: "", c: "var(--text-mid)"},
                {l: "✓ ONAYLANDI", v: "ONAYLANDI", c: "#1b7a2e"},
                {l: "✎ TASLAK", v: "TASLAK", c: "#b08a10"},
                {l: "↻ REVİZYON", v: "REVİZYON", c: "#1565C0"},
                {l: "✕ İPTAL", v: "İPTAL", c: "#c62828"},
              ].map(s => (
                <button key={s.v} onClick={() => u("stamp", s.v)}
                  style={{
                    background: params.stamp === s.v ? "rgba(255,255,255,0.08)" : "var(--bg-input)",
                    border: `1px solid ${params.stamp === s.v ? s.c : "var(--border-mid)"}`,
                    borderRadius: 3, padding: "4px 8px", color: params.stamp === s.v ? s.c : "var(--text-lo)",
                    fontSize: 9, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: params.stamp === s.v ? 800 : 500
                  }}>{s.l}</button>
              ))}
            </div>
            {params.stamp && (
              <div style={{ marginTop: 4 }}>
                <label style={LBL}>Damga Tarihi</label>
                <input type="date" value={params.stampDate || new Date().toISOString().slice(0,10)}
                  onChange={(e) => u("stampDate", e.target.value)}
                  style={{...INP, fontSize: 10.5}} />
              </div>
            )}
          </div>

          {/* Paylaşım */}
          <div style={{ borderTop: "1px solid var(--border-dim)", marginTop: 8, paddingTop: 7 }}>
            <label style={LBL}>Hızlı Paylaşım</label>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => {
                const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
                const clone = svgEl.cloneNode(true); clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
                const svgData = new XMLSerializer().serializeToString(clone);
                const canvas = document.createElement("canvas"); const vb = svgEl.viewBox.baseVal;
                canvas.width = vb.width*4; canvas.height = vb.height*4;
                const ctx = canvas.getContext("2d"); const img = new Image();
                img.onload = () => { ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
                  canvas.toBlob((blob) => {
                    const file = new File([blob], `${params.toolName}.png`, {type:"image/png"});
                    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
                      navigator.share({ title: params.toolName + " - Teknik Resim", files: [file] });
                    } else {
                      const url = `https://wa.me/?text=${encodeURIComponent(params.toolName + " - MİHENK Teknik Resim")}`;
                      window.open(url, "_blank");
                    }
                  }, "image/png");
                };
                img.src = "data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData)));
              }}
                style={{ flex: 1, background: "#1b5e20", border: "none", borderRadius: 3, padding: "6px 0", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700 }}>
                📱 WhatsApp
              </button>
              <button onClick={() => {
                const svgEl = document.getElementById("teknik-svg"); if (!svgEl) return;
                const clone = svgEl.cloneNode(true); clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
                const svgData = new XMLSerializer().serializeToString(clone);
                const canvas = document.createElement("canvas"); const vb = svgEl.viewBox.baseVal;
                canvas.width = vb.width*4; canvas.height = vb.height*4;
                const ctx = canvas.getContext("2d"); const img = new Image();
                img.onload = () => { ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
                  canvas.toBlob((blob) => {
                    const file = new File([blob], `${params.toolName}.png`, {type:"image/png"});
                    if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
                      navigator.share({ title: params.toolName + " - Teknik Resim", text: "MİHENK Kesici Takımlar - " + params.toolName, files: [file] });
                    } else {
                      const subject = encodeURIComponent(params.toolName + " - MİHENK Teknik Resim");
                      window.open(`mailto:?subject=${subject}&body=${encodeURIComponent("Ekte teknik resim bulunmaktadır.")}`, "_blank");
                    }
                  }, "image/png");
                };
                img.src = "data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svgData)));
              }}
                style={{ flex: 1, background: "#1565C0", border: "none", borderRadius: 3, padding: "6px 0", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "var(--mono)", fontWeight: 700 }}>
                ✉ E-posta
              </button>
            </div>
          </div>
        </div>}


        {/* TAKIM KÜTÜPHANESİ */}
        {SH("Takım Kütüphanesi", "lib", "◆")}
        {openSec.lib && <LibraryPanel params={params} setParams={setParams} INP={INP} />}

      </div>{/* end scroll */}
    </div>
  );
}

export { Panel };
