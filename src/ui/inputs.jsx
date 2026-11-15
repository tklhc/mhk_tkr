import { useState } from "react";

// ─── Ortak girdi bileşenleri (stiller src/styles.css) ───

const goster = (v) => (Number.isFinite(+v) ? String(Math.round(+v * 10000) / 10000) : "");

/**
 * Sayı alanı (+ isteğe bağlı tolerans). Yazarken ara değerler ("8.", "") korunur,
 * virgül ondalık olarak kabul edilir, ↑/↓ ile adım atılır.
 */
export function Sayi({ label, value, onChange, step = 1, min, unit = "mm", tol, onTol, hata, disabled, alan }) {
  const [yerel, setYerel] = useState(null);
  const metin = yerel ?? goster(value);
  const uygula = (v) => { if (min != null && v < min) v = min; onChange(Math.round(v * 10000) / 10000); };
  return (
    <div className={`satir${onTol ? "" : " tolsuz"}`}>
      <label title={label}>{label}</label>
      <input
        type="text" inputMode="decimal" value={metin} disabled={disabled} data-alan={alan}
        className={hata ? "hatali" : ""} title={hata || undefined} aria-invalid={!!hata}
        onChange={(e) => {
          const t = e.target.value;
          setYerel(t);
          const v = parseFloat(t.replace(",", "."));
          if (Number.isFinite(v)) onChange(v);
          else if (t === "") onChange(0);
        }}
        onBlur={() => setYerel(null)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const k = (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * step;
          const v = (parseFloat(String(metin).replace(",", ".")) || 0) + (e.key === "ArrowUp" ? k : -k);
          setYerel(null);
          uygula(v);
        }}
      />
      <span className="birim">{unit}</span>
      {onTol && <input type="text" className="tol" value={tol || ""} placeholder="tolerans" title="Örn: h6, ±0,05, +0,02/−0,01" onChange={(e) => onTol(e.target.value)} />}
    </div>
  );
}

/** Etiketli tek sayı kutusu (grid içinde); yazarken ara değerleri korur. */
export function SayiKutu({ label, value, onChange, hata }) {
  const [yerel, setYerel] = useState(null);
  return (
    <div>
      <label className="alan-etiket">{label}</label>
      <input className={`alan${hata ? " hatali" : ""}`} inputMode="decimal" value={yerel ?? goster(value)} title={hata || undefined}
        onFocus={(e) => e.target.select()} onBlur={() => setYerel(null)}
        onChange={(e) => { const t = e.target.value; setYerel(t); const v = parseFloat(t.replace(",", ".")); if (Number.isFinite(v)) onChange(v); }} />
    </div>
  );
}

export function Metin({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className="alan-grup">
      {label && <label className="alan-etiket">{label}</label>}
      <input type={type} className={`alan ${className}`} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Secim({ label, value, onChange, secenekler }) {
  return (
    <div className="alan-grup">
      {label && <label className="alan-etiket">{label}</label>}
      <select className="secim" value={value} onChange={(e) => onChange(e.target.value)}>
        {secenekler.map(([v, ad]) => <option key={v} value={v}>{ad}</option>)}
      </select>
    </div>
  );
}

export function Anahtar({ acik, onChange, children, altMetin }) {
  return (
    <div className={`anahtar${acik ? " acik" : ""}`} role="switch" aria-checked={!!acik} tabIndex={0}
      onClick={() => onChange(!acik)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!acik); } }}>
      <span className="kutu" />
      <span>{children}{altMetin && <small>{altMetin}</small>}</span>
    </div>
  );
}

export function Cip({ acik, onClick, children, sinif = "" }) {
  return <button type="button" className={`cip ${sinif}${acik ? " acik" : ""}`} aria-pressed={!!acik} onClick={onClick}>{children}</button>;
}

export function Grup({ baslik, sag, children }) {
  return (
    <section className="grup">
      <div className="grup-baslik"><span>{baslik}</span>{sag && <small>{sag}</small>}</div>
      {children}
    </section>
  );
}

export function Ek({ baslik, acik = false, rozet, children }) {
  return (
    <details className="ek" open={acik}>
      <summary><span>{baslik}</span>{rozet && <small style={{ color: "var(--text-lo)", fontWeight: 500 }}>{rozet}</small>}</summary>
      <div className="ek-ic">{children}</div>
    </details>
  );
}
