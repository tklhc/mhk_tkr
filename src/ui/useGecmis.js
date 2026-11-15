import { useCallback, useEffect, useRef, useState } from "react";

const BEKLEME = 400;   // ms: art arda değişiklikler tek adım sayılır (yazarken her tuş ayrı adım olmasın)
const AZAMI = 100;

/**
 * Geri al / yinele: resmin (params) ve görünüş/ölçü konumlarının (dimOff) anlık görüntüleri.
 * Uygulama durumu `uygula(params, dimOff)` ile geri yüklenir.
 */
export function useGecmis(params, dimOff, uygula) {
  const g = useRef({ yigin: [], ileri: [], son: null });
  const guncel = useRef({ params, dimOff });
  guncel.current = { params, dimOff };
  const [, yenile] = useState(0);

  // Bekleyen değişikliği kaydet: son kayıttan farklıysa eski hali yığına koy
  const kaydet = useCallback(() => {
    const h = g.current, an = guncel.current;
    if (!h.son) { h.son = an; return; }
    if (h.son.params === an.params && h.son.dimOff === an.dimOff) return;
    h.yigin.push(h.son);
    if (h.yigin.length > AZAMI) h.yigin.shift();
    h.ileri = [];
    h.son = an;
    yenile((n) => n + 1);
  }, []);

  useEffect(() => {
    const t = setTimeout(kaydet, BEKLEME);
    return () => clearTimeout(t);
  }, [params, dimOff, kaydet]);

  const geriAl = useCallback(() => {
    kaydet();
    const h = g.current;
    if (!h.yigin.length) return;
    h.ileri.push(h.son);
    h.son = h.yigin.pop();
    uygula(h.son.params, h.son.dimOff);
    yenile((n) => n + 1);
  }, [kaydet, uygula]);

  const yinele = useCallback(() => {
    kaydet();
    const h = g.current;
    if (!h.ileri.length) return;
    h.yigin.push(h.son);
    h.son = h.ileri.pop();
    uygula(h.son.params, h.son.dimOff);
    yenile((n) => n + 1);
  }, [kaydet, uygula]);

  // Ctrl/Cmd+Z geri al, Ctrl/Cmd+Shift+Z ve Ctrl+Y yinele (yazı alanlarında tarayıcının kendi geri alması kalır)
  useEffect(() => {
    const tus = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); geriAl(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); yinele(); }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [geriAl, yinele]);

  return { geriAl, yinele, geriVar: g.current.yigin.length > 0 || (g.current.son != null && (g.current.son.params !== params || g.current.son.dimOff !== dimOff)), yineleVar: g.current.ileri.length > 0 };
}
