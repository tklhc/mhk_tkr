// ─── INPUT COMPONENTS ───────────────────────────────────

function NI({ label, value, onChange, min, max, step = 1, unit = "mm", disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
      <label style={{ width: 100, fontSize: 10.5, color: "var(--text-mid)", flexShrink: 0, fontFamily: "var(--mono)" }}>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step} disabled={disabled}
        style={{
          flex: 1, maxWidth: 68, background: disabled ? "var(--bg-surface)" : "var(--bg-input)",
          border: "1px solid var(--border-mid)", borderRadius: 3, padding: "3px 6px",
          color: disabled ? "var(--text-lo)" : "var(--text-hi)", fontSize: 11.5,
          fontFamily: "var(--mono)",
        }} />
      <span style={{ fontSize: 9, color: "var(--text-label)", width: 20, fontFamily: "var(--mono)" }}>{unit}</span>
    </div>
  );
}

function TolInput({ value, onChange }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder="h6, ±0.01"
      style={{
        width: 60, background: "var(--bg-input)", border: "1px solid var(--border-mid)", borderRadius: 3,
        padding: "2px 4px", color: "#d07070", fontSize: 10,
        fontFamily: "var(--mono)",
      }} />
  );
}

function NIT({ label, value, onChange, min, max, step = 1, unit = "mm", tolVal, onTolChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
      <label style={{ width: 82, fontSize: 10.5, color: "var(--text-mid)", flexShrink: 0, fontFamily: "var(--mono)" }}>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step}
        style={{
          flex: 1, maxWidth: 58, background: "var(--bg-input)",
          border: "1px solid var(--border-mid)", borderRadius: 3, padding: "3px 5px",
          color: "var(--text-hi)", fontSize: 11.5,
          fontFamily: "var(--mono)",
        }} />
      <span style={{ fontSize: 9, color: "var(--text-label)", width: 16, fontFamily: "var(--mono)" }}>{unit}</span>
      {onTolChange && <TolInput value={tolVal || ""} onChange={onTolChange} />}
    </div>
  );
}

export { NI, TolInput, NIT };
