import { DC, DS } from "./styles";
import { CL } from "./dimensions";
import { IMG_FREZE, IMG_MATKAP, IMG_ALU3Z, IMG_RADIUS, IMG_KURE } from "../assets/images";

// ─── END VIEW (bigger, bolder) ──────────────────────────

function EndView({ params, cx, cy, R }) {
  const { D, z, coolantHole, coolantCount, cutDir, toolType } = params;
  const dirMul = cutDir === "Sol" ? -1 : 1;
  const e = [];

  // Determine which photo to use based on tool type
  const isDrill = toolType === "drill" || toolType === "stepdrill";
  // Select photo based on tool type and flute count
  let photoSrc = IMG_FREZE; // default 4Z
  if (isDrill) photoSrc = IMG_MATKAP;
  else if (toolType === "flat" && z === 3) photoSrc = IMG_ALU3Z;
  else if (toolType === "bullnose") photoSrc = IMG_RADIUS;
  else if (toolType === "ballnose") photoSrc = IMG_KURE;
  else if (toolType === "flat" || toolType === "chamfer") photoSrc = IMG_FREZE;
  const clipId = `endClip-${cx.toFixed(0)}`;

  // Clip path for circular photo
  e.push(
    <defs key="clip-def">
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={R * 0.98} />
      </clipPath>
    </defs>
  );

  // Photo background (clipped to circle)
  e.push(
    <image key="photo-bg" href={photoSrc}
      x={cx - R * 1.02} y={cy - R * 1.02} width={R * 2.04} height={R * 2.04}
      clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice"
      opacity={0.85} />
  );

  // Outer circle border
  e.push(<circle key="out" cx={cx} cy={cy} r={R} fill="none" stroke={DS.outline} strokeWidth={DS.oW * 2} />);

  // Coolant holes (on top of photo)
  if (coolantHole && coolantCount > 0) {
    const coolR = R * 0.1;
    const coolDist = R * 0.55;
    for (let i = 0; i < coolantCount; i++) {
      const a = (i * 2 * Math.PI) / coolantCount - Math.PI / 2;
      e.push(
        <circle key={`clbg-${i}`} cx={cx + coolDist * Math.cos(a)} cy={cy + coolDist * Math.sin(a)} r={coolR + 0.5}
          fill="rgba(0,0,0,0.4)" stroke="none" />,
        <circle key={`cl-${i}`} cx={cx + coolDist * Math.cos(a)} cy={cy + coolDist * Math.sin(a)} r={coolR}
          fill="#b8dce8" stroke={DS.outline} strokeWidth={DS.oW * 1.5} />
      );
    }
  }

  // Center marks
  e.push(
    <CL key="ch" x1={cx - R - 5} y1={cy} x2={cx + R + 5} y2={cy} />,
    <CL key="cv" x1={cx} y1={cy - R - 5} x2={cx} y2={cy + R + 5} />
  );

  // Rotation direction arrow
  {
    const arR = R + 3;
    const aStart = dirMul > 0 ? -0.3 : 0.3;
    const aEnd = dirMul > 0 ? 1.0 : -1.0;
    const sx = cx + arR * Math.cos(aStart);
    const sy = cy + arR * Math.sin(aStart);
    const ex = cx + arR * Math.cos(aEnd);
    const ey = cy + arR * Math.sin(aEnd);
    const aw = 1.5;
    const aAng = aEnd + dirMul * 0.15;
    e.push(
      <path key="rot-arc" d={`M ${sx} ${sy} A ${arR} ${arR} 0 0 ${dirMul > 0 ? 1 : 0} ${ex} ${ey}`}
        fill="none" stroke="#888" strokeWidth={0.3} />,
      <polygon key="rot-arrow" points={`${ex},${ey} ${cx + (arR - aw) * Math.cos(aAng)},${cy + (arR - aw) * Math.sin(aAng)} ${cx + (arR + aw) * Math.cos(aAng)},${cy + (arR + aw) * Math.sin(aAng)}`}
        fill="#888" stroke="none" />
    );
  }

  // Diameter dimension
  const da = 40 * Math.PI / 180;
  e.push(
    <g key="dd" fill={DC} stroke={DC} strokeWidth={DS.dim}>
      <line x1={cx - R * Math.cos(da)} y1={cy + R * Math.sin(da)} x2={cx + R * Math.cos(da)} y2={cy - R * Math.sin(da)} />
      <circle cx={cx - R * Math.cos(da)} cy={cy + R * Math.sin(da)} r={0.9} stroke="none" />
      <circle cx={cx + R * Math.cos(da)} cy={cy - R * Math.sin(da)} r={0.9} stroke="none" />
      <text x={cx + R * Math.cos(da) + 3} y={cy - R * Math.sin(da) - 1.5}
        fontSize={3.8} fontFamily="'IBM Plex Mono', monospace" fill={DC} stroke="none" fontWeight="600">⌀{D}</text>
    </g>
  );

  return <g>{e}</g>;
}

export { EndView };
