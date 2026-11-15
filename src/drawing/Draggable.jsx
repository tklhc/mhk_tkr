import { useCallback, useRef } from "react";

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

export { svgPoint, Draggable, useSurukle };
