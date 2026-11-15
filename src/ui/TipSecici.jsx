import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PARAMS, TOOL_TYPES } from "../constants";
import { tipUygula } from "../geometry/tipler";
import { takimProfili, tamKontur, svgYolu } from "../geometry/profil";
import { Ikon } from "./Ikon";

const W = 76, H = 30;

/** Takım tipinin ucunun küçük silueti: aynı geometri modelinden, ucun son ~3,4 çap boyu çizilir. */
export function TipSilueti({ tip }) {
  const yol = useMemo(() => {
    const p = tipUygula({ ...DEFAULT_PARAMS, D: 10, d: 10, L: 60 }, tip);
    const g = takimProfili(p);
    const dmax = Math.max(g.D, g.d, 1);
    const xs = Math.max(0, g.L - 3.4 * dmax);
    const sc = (W - 4) / (g.L - xs);
    return svgYolu(tamKontur(g), (x, r) => [+(2 + (x - xs) * sc).toFixed(2), +(H / 2 - r * sc).toFixed(2)]) + " Z";
  }, [tip]);
  return (
    <svg className="tip-siluet" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs><clipPath id={`ts-${tip}`}><rect x={0} y={0} width={W} height={H} /></clipPath></defs>
      <g clipPath={`url(#ts-${tip})`}><path d={yol} fill="currentColor" fillOpacity={0.16} stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" /></g>
    </svg>
  );
}

/** Takım tipi seçici: açılır kart ızgarası, her kartta tipin silueti. */
export function TipSecici({ deger, onSec }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!acik) return;
    const kapat = (e) => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    const esc = (e) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("mousedown", kapat);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", kapat); document.removeEventListener("keydown", esc); };
  }, [acik]);
  return (
    <div className="tip-secici-kap" ref={ref}>
      <button type="button" className="tip-dugme" aria-haspopup="listbox" aria-expanded={acik} aria-label={`Takım tipi: ${TOOL_TYPES[deger]}`} onClick={() => setAcik((a) => !a)}>
        <TipSilueti tip={deger} />
        <span className="tip-ad">{TOOL_TYPES[deger]}</span>
        <Ikon ad="asagi" boyut={16} />
      </button>
      {acik && (
        <div className="tip-izgara" role="listbox" aria-label="Takım tipleri">
          {Object.entries(TOOL_TYPES).map(([k, ad]) => (
            <button type="button" key={k} role="option" aria-selected={k === deger} className={`tip-kart${k === deger ? " secili" : ""}`}
              onClick={() => { onSec(k); setAcik(false); }}>
              <TipSilueti tip={k} />
              <span>{ad}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
