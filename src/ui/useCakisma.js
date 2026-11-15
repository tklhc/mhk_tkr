import { useEffect, useState } from "react";
import { cakismaBul, kutulariTopla } from "../drawing/cakisma";

const imza = (liste) => JSON.stringify(liste.map((c) => [c.a.metin, c.b.metin, +c.alan.x.toFixed(1), +c.alan.y.toFixed(1)]));

/**
 * Çizimdeki yazı çakışmalarını (ölçü, açı, kılavuz, not) ölçer. Çizim ve konumlar değiştikçe,
 * yazı tipi ve ölçüler yerleştikten kısa süre sonra yeniden denetler.
 * @returns {Array<{a: object, b: object, alan: {x:number,y:number,w:number,h:number}}>}
 */
export function useCakisma(aktif, params, dimOff) {
  const [liste, setListe] = useState([]);
  useEffect(() => {
    if (!aktif) return undefined;
    const t = setTimeout(() => {
      const svg = document.getElementById("teknik-svg");
      if (!svg) return;
      const r = cakismaBul(kutulariTopla(svg));
      setListe((onceki) => (imza(onceki) === imza(r) ? onceki : r));
    }, 300);
    return () => clearTimeout(t);
  }, [aktif, params, dimOff]);
  return aktif ? liste : [];
}
