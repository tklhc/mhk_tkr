import { useEffect, useRef, useState } from "react";

/** Açılır menü düğmesi: dışarı tıklayınca ya da Esc ile kapanır. */
export function Menu({ etiket, ikon, birincil = false, children }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!acik) return;
    const kapat = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    const esc = (e) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("mousedown", kapat);
    document.addEventListener("touchstart", kapat);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", kapat);
      document.removeEventListener("touchstart", kapat);
      document.removeEventListener("keydown", esc);
    };
  }, [acik]);
  return (
    <div className="menu" ref={ref}>
      <button type="button" className={`btn${birincil ? " birincil" : ""}`} aria-haspopup="menu" aria-expanded={acik} onClick={() => setAcik((a) => !a)}>
        {ikon}<span className="metin">{etiket}</span> <span aria-hidden="true">▾</span>
      </button>
      {acik && <div className="menu-liste" role="menu" onClick={() => setAcik(false)}>{children}</div>}
    </div>
  );
}

export function MenuOge({ onClick, children, altMetin }) {
  return (
    <button type="button" role="menuitem" className="menu-oge" onClick={onClick}>
      {children}
      {altMetin && <small>{altMetin}</small>}
    </button>
  );
}

export const MenuAyrac = () => <div className="menu-ayrac" role="separator" />;
