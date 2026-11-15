import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ─── SÜRÜKLEME ──────────────────────────────────────────
// Ölçü ve etiketlerin yerini elle ince ayarlamak için. Kaydırma miktarları
// SVG kullanıcı biriminde (mm) offsets[id] = { dx, dy } olarak tutulur.

function svgPoint(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  return pt.matrixTransform(svgEl.getScreenCTM().inverse());
}

/** Sürükleme kancası: kaydırma değeri ve fare/dokunma olayları. */
function useSurukle(id, offsets, setOffsets, axis) {
  const off = (id && offsets && offsets[id]) || { dx: 0, dy: 0 };
  const dragRef = useRef(null);

  const onStart = useCallback((clientX, clientY) => {
    if (!id || !setOffsets) return;
    const svg = document.getElementById("teknik-svg");
    if (!svg) return;
    const p = svgPoint(svg, clientX, clientY);
    dragRef.current = { startX: p.x - off.dx, startY: p.y - off.dy };

    const onMove = (cx, cy) => {
      if (!dragRef.current) return;
      const mp = svgPoint(svg, cx, cy);
      const newDx = axis === "y" ? 0 : mp.x - dragRef.current.startX;
      const newDy = axis === "x" ? 0 : mp.y - dragRef.current.startY;
      setOffsets(prev => ({ ...prev, [id]: { dx: newDx, dy: newDy } }));
    };

    const onEnd = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", mmH);
      document.removeEventListener("mouseup", muH);
      document.removeEventListener("touchmove", tmH);
      document.removeEventListener("touchend", teH);
    };

    const mmH = (e) => onMove(e.clientX, e.clientY);
    const muH = () => onEnd();
    const tmH = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const teH = () => onEnd();

    document.addEventListener("mousemove", mmH);
    document.addEventListener("mouseup", muH);
    document.addEventListener("touchmove", tmH, { passive: false });
    document.addEventListener("touchend", teH);
  }, [id, off, setOffsets, axis]);

  const olaylar = id && setOffsets ? {
    style: { cursor: axis === "y" ? "ns-resize" : axis === "x" ? "ew-resize" : "move" },
    onMouseDown: (e) => { e.stopPropagation(); onStart(e.clientX, e.clientY); },
    onTouchStart: (e) => { e.stopPropagation(); onStart(e.touches[0].clientX, e.touches[0].clientY); },
  } : {};
  return { off, olaylar };
}

/** Çocuklarını bütün olarak kaydıran sürüklenebilir grup (etiketler, notlar). */
function Draggable({ id, offsets, setOffsets, axis, children }) {
  const { off, olaylar } = useSurukle(id, offsets, setOffsets, axis);
  return (
    <g transform={`translate(${off.dx},${off.dy})`} {...olaylar}>
      {children}
    </g>
  );
}

// Sunucuda (testler) useLayoutEffect uyarı verir; orada useEffect kullanılır.
const useOlcumEfekti = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Bir görünüşü (takım, detay, uçtan görünüş, kesit) bütün olarak sürükleme.
 * Grubun kapladığı dikdörtgen görünmez bir tutamaçtır (ince çizgiyi tam
 * yakalamak gerekmez); üzerine gelince kesikli çerçeve çıkar. İçindeki ölçü
 * ve etiketler kendi tutamaçlarını koruyup ayrıca sürüklenebilir.
 * Tutamaç dışa aktarmada (SVG/PNG/PDF) kaldırılır.
 */
function Surukle({ id, offsets, setOffsets, kutu, children }) {
  const { off, olaylar } = useSurukle(id, offsets, setOffsets);
  const aktif = !!(id && setOffsets);
  const grup = useRef(null), tutac = useRef(null);
  useOlcumEfekti(() => {
    const g = grup.current, r = tutac.current;
    if (!g || !r) return;
    let b = null;
    if (kutu) b = { x: kutu[0], y: kutu[1], width: kutu[2], height: kutu[3] };   // klip kullanan görünüşlerde (getBBox klipi görmez) elle verilir
    else {
      r.setAttribute("display", "none");        // kendi dikdörtgenini ölçmeyelim
      try { b = g.getBBox(); } catch { b = null; }
      r.removeAttribute("display");
    }
    const gecerli = b && b.width > 0 && b.height > 0;
    for (const [k, v] of Object.entries({ x: gecerli ? b.x - 1 : 0, y: gecerli ? b.y - 1 : 0, width: gecerli ? b.width + 2 : 0, height: gecerli ? b.height + 2 : 0 })) r.setAttribute(k, String(+v.toFixed(2)));
  });
  return (
    <g ref={grup} transform={`translate(${off.dx},${off.dy})`}>
      {aktif && <rect ref={tutac} className="gorunum-tutac" x={0} y={0} width={0} height={0} fill="rgba(0,0,0,0)" stroke="none" {...olaylar} />}
      {children}
    </g>
  );
}

export { svgPoint, Draggable, Surukle, useSurukle };
