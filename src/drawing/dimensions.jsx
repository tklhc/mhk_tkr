import { DC, DS } from "./styles";
import { Draggable } from "./Draggable";

// ─── DIMENSION HELPERS ──────────────────────────────────

function DimH({ x1, x2, y, label, tol, side = "bottom", offset = 7, dragId, offsets, setOffsets }) {
  const dir = side === "top" ? -1 : 1;
  const yL = y + dir * offset;
  const yT = yL + dir * 5.5;
  const mid = (x1 + x2) / 2;
  const a = 1.8;
  if (Math.abs(x2 - x1) < 0.3) return null;
  const tolText = tol || "";
  const inner = (
    <g fill={DC} stroke={DC} strokeWidth={DS.dim}>
      <line x1={x1} y1={y + dir * 1.2} x2={x1} y2={yL + dir * 2} />
      <line x1={x2} y1={y + dir * 1.2} x2={x2} y2={yL + dir * 2} />
      <line x1={x1} y1={yL} x2={x2} y2={yL} />
      <polygon points={`${x1},${yL} ${x1 + a},${yL - a * 0.35} ${x1 + a},${yL + a * 0.35}`} stroke="none" />
      <polygon points={`${x2},${yL} ${x2 - a},${yL - a * 0.35} ${x2 - a},${yL + a * 0.35}`} stroke="none" />
      <text x={mid} y={yT} textAnchor="middle" dominantBaseline={side === "top" ? "auto" : "hanging"}
        fontSize={3.8} fontFamily="'IBM Plex Mono', monospace" fill={DC} stroke="none" fontWeight="600">{label}
        {tolText && <tspan fontSize={2.6} fill="#cc0000" fontWeight="700" dy={-1.5}> {tolText}</tspan>}
      </text>
    </g>
  );
  if (dragId && offsets && setOffsets) return <Draggable id={dragId} offsets={offsets} setOffsets={setOffsets} axis="y">{inner}</Draggable>;
  return inner;
}

function DimV({ y1, y2, x, label, tol, side = "left", offset = 6, dragId, offsets, setOffsets }) {
  const dir = side === "left" ? -1 : 1;
  const xL = x + dir * offset;
  const xT = xL + dir * 5;
  const mid = (y1 + y2) / 2;
  const a = 1.8;
  if (Math.abs(y2 - y1) < 0.3) return null;
  const tolText = tol || "";
  const inner = (
    <g fill={DC} stroke={DC} strokeWidth={DS.dim}>
      <line x1={x + dir * 1.2} y1={y1} x2={xL + dir * 2} y2={y1} />
      <line x1={x + dir * 1.2} y1={y2} x2={xL + dir * 2} y2={y2} />
      <line x1={xL} y1={y1} x2={xL} y2={y2} />
      <polygon points={`${xL},${y1} ${xL - a * 0.35},${y1 + a} ${xL + a * 0.35},${y1 + a}`} stroke="none" />
      <polygon points={`${xL},${y2} ${xL - a * 0.35},${y2 - a} ${xL + a * 0.35},${y2 - a}`} stroke="none" />
      <text x={xT} y={mid} textAnchor="middle" dominantBaseline="central"
        fontSize={3.8} fontFamily="'IBM Plex Mono', monospace" fill={DC} stroke="none" fontWeight="600"
        transform={`rotate(-90, ${xT}, ${mid})`}>{label}{tolText && <tspan fontSize={2.6} fill="#cc0000" fontWeight="700"> {tolText}</tspan>}</text>
    </g>
  );
  if (dragId && offsets && setOffsets) return <Draggable id={dragId} offsets={offsets} setOffsets={setOffsets} axis="x">{inner}</Draggable>;
  return inner;
}

function CL({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={DS.center} strokeWidth={DS.cW} strokeDasharray="8,2,2,2" />;
}

export { DimH, DimV, CL };
