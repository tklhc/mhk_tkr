import { DC, DS } from "./styles";
import { Draggable } from "./Draggable";
import { DimH, DimV, CL } from "./dimensions";

function SideView({ params, ox, oy, scale, dimOff, setDimOff }) {
  let { D, d, L, l1, l2, z, helix, toolType, rCorner, chamferSize, dCore, neckDia, neckAngle } = params;

  // For stepdrill: override l1 from steps, disable neck
  if (toolType === "stepdrill") {
    const stps = params.steps || [];
    l1 = stps.reduce((sum, st) => sum + (st.len || 0), 0);
    l2 = 0;
    D = stps.length > 0 ? Math.max(...stps.map(s => s.dia)) : D;
  }

  const s = scale;
  const hD = (D / 2) * s;
  const hd = (d / 2) * s;
  const tL = L * s;
  const cL = l1 * s;
  const nL = l2 * s;
  const cR = (dCore / 2) * s;
  const coR = rCorner * s;

  // Neck diameter from user param
  const nD = l2 > 0 ? neckDia : D;
  const hN = (nD / 2) * s;

  // Transition zone: angled taper from shank to neck — NOT part of l2
  const aRad = (neckAngle * Math.PI) / 180;
  const transDx = (l2 > 0 && d > nD) ? ((d - nD) / 2) / Math.tan(aRad) * s : 0;

  // Layout: sLeft──[shank]──sRight──[transition tDx]──tRight──[neck l2]──nRight──[cutting l1]──tipR
  const sL = tL - cL - nL - transDx;
  const sLeft = ox - tL / 2;
  const sRight = sLeft + Math.max(sL, 0);
  const tRight = sRight + transDx;  // end of transition
  const nRight = tRight + nL;       // end of neck = start of cutting
  const tipR = sLeft + tL;

  const e = [];

  // ── Shank ──
  if (sL > 0.3) {
    e.push(
      <rect key="shank-fill" x={sLeft} y={oy - hd} width={Math.max(sL, 0)} height={hd * 2} fill="url(#gShank)" stroke="none" filter="url(#shadow)" />,
      <rect key="shank" x={sLeft} y={oy - hd} width={Math.max(sL, 0)} height={hd * 2} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />
    );
  }

  // ── Angled transition zone (outside l2) ──
  if (l2 > 0 && transDx > 0.3) {
    // Transition fill
    const transFill = `M ${sRight} ${oy - hd} L ${tRight} ${oy - hN} L ${tRight} ${oy + hN} L ${sRight} ${oy + hd} Z`;
    e.push(<path key="tp-fill" d={transFill} fill="url(#gNeck)" stroke="none" />);
    e.push(
      <line key="tp-t" x1={sRight} y1={oy - hd} x2={tRight} y2={oy - hN} stroke={DS.outline} strokeWidth={DS.oW} />,
      <line key="tp-b" x1={sRight} y1={oy + hd} x2={tRight} y2={oy + hN} stroke={DS.outline} strokeWidth={DS.oW} />
    );

    // Angle annotation
    const angLblX = sRight + transDx * 0.5;
    e.push(
      <path key="ang-arc" d={`M ${sRight + 0.5} ${oy + hd - 0.5} L ${sRight + transDx * 0.35} ${oy + hd - (hd - hN) * 0.35}`}
        fill="none" stroke="#e65100" strokeWidth={0.3} />,
      <Draggable id="ang-lbl" offsets={dimOff} setOffsets={setDimOff}><text key="ang-lbl" x={angLblX + 1} y={oy + hd + 5}
        fontSize={3.4} fontFamily="'IBM Plex Mono', monospace" fill="#e65100" fontWeight="700" textAnchor="middle">
        {neckAngle}°
      </text></Draggable>
    );
  } else if (l2 > 0 && Math.abs(hd - hN) > 0.2) {
    // 90° step if no meaningful angle
    e.push(
      <line key="sn-t" x1={sRight} y1={oy - hd} x2={sRight} y2={oy - hN} stroke={DS.outline} strokeWidth={DS.oW} />,
      <line key="sn-b" x1={sRight} y1={oy + hd} x2={sRight} y2={oy + hN} stroke={DS.outline} strokeWidth={DS.oW} />
    );
  }

  // ── Neck (pure l2, straight rectangle) ──
  if (l2 > 0 && nL > 0.3) {
    e.push(
      <rect key="nk-fill" x={tRight} y={oy - hN} width={nL} height={hN * 2} fill="url(#gNeck)" stroke="none" filter="url(#shadow)" />,
      <rect key="nk" x={tRight} y={oy - hN} width={nL} height={hN * 2} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />
    );
  }

  // ── Cutting section ──
  const cLeft = nRight;
  const isDrill = toolType === "drill" || toolType === "stepdrill";

  if (toolType === "stepdrill") {
    // ── Step Drill: Step 1 (smallest) at TIP (right), larger steps toward SHANK (left) ──
    const stps = params.steps || [];
    if (stps.length > 0) {
      const maxHR = (stps[stps.length - 1]?.dia || D) / 2 * s;

      // Build from RIGHT to LEFT: tipR is the drill point
      let curX = tipR; // start at rightmost point

      // Step 0 = smallest = drill tip (rightmost)
      const st0 = stps[0];
      const hr0 = (st0.dia / 2) * s;
      const stepL0 = st0.len * s;
      const ptAng0 = (st0.angle || 140) * Math.PI / 180;
      const tipDx0 = hr0 / Math.tan(ptAng0 / 2);

      // Drill tip V-point at right end — fill first
      const tipFill = `M ${curX - tipDx0} ${oy - hr0} L ${curX} ${oy} L ${curX - tipDx0} ${oy + hr0} Z`;
      e.push(<path key="stp-tip-fill" d={tipFill} fill="url(#gTip)" stroke="none" opacity={0.6} />);
      e.push(<path key="stp-tip" d={`M ${curX - tipDx0} ${oy - hr0} L ${curX} ${oy} L ${curX - tipDx0} ${oy + hr0}`}
        fill="none" stroke={DS.outline} strokeWidth={DS.oW} />);

      // Point angle annotation — below tool
      if (params.showDimAngles) {
        e.push(
          <Draggable id="stp-pa0" offsets={dimOff} setOffsets={setDimOff}><text key="stp-pa0" x={curX - tipDx0 * 0.5} y={oy + hr0 + 5}
            fontSize={3.2} fontFamily="'IBM Plex Mono', monospace" fill="#e65100" fontWeight="700">{st0.angle}°</text></Draggable>
        );
      }

      // Body of first step (leftward from tip) — fill + outline
      const body0Right = curX - tipDx0;
      const body0Left = curX - stepL0;
      if (body0Right > body0Left) {
        e.push(
          <rect key="stp0-fill" x={body0Left} y={oy - hr0} width={body0Right - body0Left} height={hr0 * 2} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />,
          <line key="stp0-t" x1={body0Left} y1={oy - hr0} x2={body0Right} y2={oy - hr0} stroke={DS.outline} strokeWidth={DS.oW} />,
          <line key="stp0-b" x1={body0Left} y1={oy + hr0} x2={body0Right} y2={oy + hr0} stroke={DS.outline} strokeWidth={DS.oW} />
        );
      }

      // Dim step 0 — length with mm
      e.push(<DimH key="dst0" x1={body0Left} x2={curX} y={oy - maxHR} label={`${st0.len} mm`} tol={st0.tolLen} side="top" offset={5} dragId="dst0" offsets={dimOff} setOffsets={setDimOff} />);
      e.push(<DimV key="dsd0" y1={oy - hr0} y2={oy + hr0} x={(body0Left + body0Right) / 2} label={`⌀${st0.dia}`} tol={st0.tolDia} side="right" offset={5} dragId="dsd0" offsets={dimOff} setOffsets={setDimOff} />);

      let prevHR = hr0;
      curX = body0Left;

      // Subsequent steps (going leftward, each larger)
      for (let si = 1; si < stps.length; si++) {
        const st = stps[si];
        const hr = (st.dia / 2) * s;
        const stepL = st.len * s;
        const ptAng = (st.angle || 90) * Math.PI / 180;
        const transH = (hr - prevHR);
        const transDx = transH / Math.tan(ptAng / 2);

        // Angled transition fill
        const transFillPath = `M ${curX} ${oy - prevHR} L ${curX - transDx} ${oy - hr} L ${curX - transDx} ${oy + hr} L ${curX} ${oy + prevHR} Z`;
        e.push(<path key={`stf-${si}`} d={transFillPath} fill="url(#gCut)" stroke="none" opacity={0.7} />);

        // Angled transition (expanding leftward)
        e.push(
          <line key={`strans-t-${si}`} x1={curX} y1={oy - prevHR} x2={curX - transDx} y2={oy - hr} stroke={DS.outline} strokeWidth={DS.oW} />,
          <line key={`strans-b-${si}`} x1={curX} y1={oy + prevHR} x2={curX - transDx} y2={oy + hr} stroke={DS.outline} strokeWidth={DS.oW} />
        );

        // Angle annotation — below tool
        if (params.showDimAngles) {
          e.push(
            <Draggable id={`spa-${si}`} offsets={dimOff} setOffsets={setDimOff}><text key={`spa-${si}`} x={curX - transDx * 0.5} y={oy + hr + 5}
              fontSize={3.0} fontFamily="'IBM Plex Mono', monospace" fill="#e65100" fontWeight="700">{st.angle}°</text></Draggable>
          );
        }

        // Step body fill + outline
        const bodyRight = curX - transDx;
        const bodyLeft = curX - stepL;
        e.push(
          <rect key={`stpf-${si}`} x={bodyLeft} y={oy - hr} width={bodyRight - bodyLeft} height={hr * 2} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />,
          <line key={`stp-t-${si}`} x1={bodyLeft} y1={oy - hr} x2={bodyRight} y2={oy - hr} stroke={DS.outline} strokeWidth={DS.oW} />,
          <line key={`stp-b-${si}`} x1={bodyLeft} y1={oy + hr} x2={bodyRight} y2={oy + hr} stroke={DS.outline} strokeWidth={DS.oW} />
        );

        // Close left side of last step (connects to shank/neck)
        if (si === stps.length - 1) {
          e.push(
            <line key={`stp-l-${si}`} x1={bodyLeft} y1={oy - hr} x2={bodyLeft} y2={oy + hr} stroke={DS.outline} strokeWidth={DS.oW * 0.3} strokeDasharray="1,1" />
          );
        }

        // Dims with mm
        e.push(<DimH key={`dst${si}`} x1={bodyLeft} x2={curX} y={oy - maxHR} label={`${st.len} mm`} tol={st.tolLen} side="top" offset={5 + si * 7} dragId={`dst${si}`} offsets={dimOff} setOffsets={setDimOff} />);
        e.push(<DimV key={`dsd${si}`} y1={oy - hr} y2={oy + hr} x={bodyLeft} label={`⌀${st.dia}`} tol={st.tolDia} side="left" offset={5 + si * 5} dragId={`dsd${si}`} offsets={dimOff} setOffsets={setDimOff} />);

        prevHR = hr;
        curX = bodyLeft;
      }
    }

  } else if (toolType === "drill") {
    // ── Standard Drill: body + V-tip ──
    const ptAng = (params.pointAngle || 140) * Math.PI / 180;
    const tipDx = hD / Math.tan(ptAng / 2);

    // Fill body + tip as one path
    const drillFill = `M ${cLeft} ${oy - hD} L ${tipR - tipDx} ${oy - hD} L ${tipR} ${oy} L ${tipR - tipDx} ${oy + hD} L ${cLeft} ${oy + hD} Z`;
    e.push(<path key="drill-fill" d={drillFill} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />);
    // Tip highlight
    e.push(<path key="drill-tip-hl" d={`M ${tipR - tipDx} ${oy - hD} L ${tipR} ${oy} L ${tipR - tipDx} ${oy + hD} Z`}
      fill="url(#gTip)" stroke="none" opacity={0.5} />);

    // Drill point (V shape) outline
    e.push(<path key="drill-tip" d={`M ${tipR - tipDx} ${oy - hD} L ${tipR} ${oy} L ${tipR - tipDx} ${oy + hD}`}
      fill="none" stroke={DS.outline} strokeWidth={DS.oW} />);

    // Body outlines
    e.push(
      <line key="drill-t" x1={cLeft} y1={oy - hD} x2={tipR - tipDx} y2={oy - hD} stroke={DS.outline} strokeWidth={DS.oW} />,
      <line key="drill-b" x1={cLeft} y1={oy + hD} x2={tipR - tipDx} y2={oy + hD} stroke={DS.outline} strokeWidth={DS.oW} />
    );

    // Chisel edge
    const chiselW = hD * 0.15;
    e.push(
      <line key="chisel" x1={tipR - chiselW} y1={oy - chiselW * 0.6} x2={tipR - chiselW} y2={oy + chiselW * 0.6}
        stroke={DS.outline} strokeWidth={DS.oW * 0.7} />
    );

    // Point angle annotation — below tool
    if (params.showDimAngles) {
      e.push(
        <Draggable id="pt-ang" offsets={dimOff} setOffsets={setDimOff}><text key="pt-ang" x={tipR - tipDx * 0.6} y={oy + hD + 5}
          fontSize={3.4} fontFamily="'IBM Plex Mono', monospace" fill="#e65100" fontWeight="700">
          {params.pointAngle}°
        </text></Draggable>
      );
    }

    // Close left side
    e.push(
      <line key="drill-l" x1={cLeft} y1={oy - hD} x2={cLeft} y2={oy + hD} stroke={DS.outline} strokeWidth={DS.oW * 0.3} strokeDasharray="1,1" />
    );

  } else if (toolType === "ballnose") {
    const cutD = `M ${cLeft} ${oy - hD} L ${tipR - hD} ${oy - hD} A ${hD} ${hD} 0 0 1 ${tipR - hD} ${oy + hD} L ${cLeft} ${oy + hD} Z`;
    e.push(<path key="cut-fill" d={cutD} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />);
    e.push(<path key="cut" d={cutD} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />);
  } else if (toolType === "bullnose" && coR > 0) {
    const cutD = `M ${cLeft} ${oy - hD} L ${tipR - coR} ${oy - hD} A ${coR} ${coR} 0 0 1 ${tipR} ${oy - hD + coR} L ${tipR} ${oy + hD - coR} A ${coR} ${coR} 0 0 1 ${tipR - coR} ${oy + hD} L ${cLeft} ${oy + hD} Z`;
    e.push(<path key="cut-fill" d={cutD} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />);
    e.push(<path key="cut" d={cutD} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />);
  } else if (toolType === "chamfer" && chamferSize > 0) {
    const cs = chamferSize * s;
    const cutD = `M ${cLeft} ${oy - hD} L ${tipR - cs} ${oy - hD} L ${tipR} ${oy - hD + cs} L ${tipR} ${oy + hD - cs} L ${tipR - cs} ${oy + hD} L ${cLeft} ${oy + hD} Z`;
    e.push(<path key="cut-fill" d={cutD} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />);
    e.push(<path key="cut" d={cutD} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />);
  } else {
    e.push(
      <rect key="cut-fill" x={cLeft} y={oy - hD} width={cL} height={hD * 2} fill="url(#gCut)" stroke="none" filter="url(#shadow)" />,
      <rect key="cut" x={cLeft} y={oy - hD} width={cL} height={hD * 2} fill="none" stroke={DS.outline} strokeWidth={DS.oW} />
    );
  }

  // ── Cutting↔neck transition (step if diameters differ) ──
  if (l2 > 0 && Math.abs(hD - hN) > 0.2) {
    e.push(
      <line key="cn-t" x1={nRight} y1={oy - hN} x2={nRight} y2={oy - hD} stroke={DS.outline} strokeWidth={DS.oW} />,
      <line key="cn-b" x1={nRight} y1={oy + hN} x2={nRight} y2={oy + hD} stroke={DS.outline} strokeWidth={DS.oW} />
    );
  } else if (l2 === 0 && Math.abs(hD - hd) > 0.2) {
    e.push(
      <line key="cs-t" x1={sRight} y1={oy - hd} x2={sRight} y2={oy - hD} stroke={DS.outline} strokeWidth={DS.oW} />,
      <line key="cs-b" x1={sRight} y1={oy + hd} x2={sRight} y2={oy + hD} stroke={DS.outline} strokeWidth={DS.oW} />
    );
  }

  // ── Helix / flute lines (skip step drill which has its own geometry) ──
  if (helix > 0 && z > 0 && toolType !== "stepdrill") {
    const hRad = (helix * Math.PI) / 180;
    const fluteCount = z;
    const helixPitch = (Math.PI * D * s) / Math.tan(hRad);
    const lineSpacing = helixPitch / fluteCount;
    const isLeftHand = params.helixHand === "Sol";

    for (let i = -fluteCount * 2; i < Math.ceil(cL / (lineSpacing || 1)) + fluteCount * 2; i++) {
      const startX = cLeft + i * lineSpacing;
      const dx = (hD * 2) / Math.tan(hRad);
      const lx1 = startX;
      // Left hand: lines go opposite direction (top-right to bottom-left)
      const ly1 = isLeftHand ? oy + hD : oy - hD;
      const lx2 = startX + dx;
      const ly2 = isLeftHand ? oy - hD : oy + hD;

      if (lx2 < cLeft || lx1 > tipR) continue;
      const clipX1 = Math.max(cLeft, Math.min(tipR, lx1));
      const clipX2 = Math.max(cLeft, Math.min(tipR, lx2));
      if (Math.abs(clipX2 - clipX1) < 0.3) continue;

      const t1 = dx > 0 ? (clipX1 - lx1) / dx : 0;
      const t2 = dx > 0 ? (clipX2 - lx1) / dx : 1;
      const clipY1 = ly1 + t1 * (ly2 - ly1);
      const clipY2 = ly1 + t2 * (ly2 - ly1);

      e.push(
        <line key={`hx-${i}`}
          x1={clipX1} y1={clipY1} x2={clipX2} y2={clipY2}
          stroke={params.colFlute} strokeWidth={0.6} opacity={0.45} />
      );
    }

    // Helix angle annotation — below tool
    if (params.showDimHelix) {
      const angArcR = Math.min(hD * 0.8, 8);
      const angX = cLeft;
      const angY = oy + hD;
      const arcStartX = angX;
      const arcStartY = angY - angArcR;
      const arcEndX = angX + angArcR * Math.sin(hRad);
      const arcEndY = angY - angArcR * Math.cos(hRad);
      e.push(
        <line key="hx-ref" x1={angX} y1={angY} x2={angX} y2={angY - angArcR - 2}
          stroke="#2e7d32" strokeWidth={0.2} strokeDasharray="1.5,1" />,
        <path key="hx-arc"
          d={`M ${arcStartX} ${arcStartY} A ${angArcR} ${angArcR} 0 0 1 ${arcEndX} ${arcEndY}`}
          fill="none" stroke="#2e7d32" strokeWidth={0.3} />,
        <Draggable id="hx-lbl" offsets={dimOff} setOffsets={setDimOff}><text key="hx-lbl" x={angX + angArcR * 0.7 + 1} y={angY - angArcR * 0.3}
          fontSize={3.4} fontFamily="'IBM Plex Mono', monospace" fill="#2e7d32" fontWeight="700">
          {helix}° {isLeftHand ? "L" : "R"}
        </text></Draggable>
      );
    }
  }

  // ── Core hidden lines ──
  if (dCore > 0 && dCore < D) {
    e.push(
      <line key="cr-t" x1={cLeft} y1={oy - cR} x2={tipR} y2={oy - cR} stroke={DS.hidden} strokeWidth={DS.hW} strokeDasharray="2,1.5" />,
      <line key="cr-b" x1={cLeft} y1={oy + cR} x2={tipR} y2={oy + cR} stroke={DS.hidden} strokeWidth={DS.hW} strokeDasharray="2,1.5" />
    );
  }

  // ── Center line ──
  e.push(<CL key="cl" x1={sLeft - 4} y1={oy} x2={tipR + 4} y2={oy} />);

  // ── DIMENSIONS (respect show/hide toggles) ──
  const dimBase = oy + Math.max(hD, hd);

  // Total L
  if (params.showDimL) {
    e.push(<DimH key="dL" x1={sLeft} x2={tipR} y={dimBase} label={`${L} mm`} tol={params.tolL} side="bottom" offset={toolType === "stepdrill" ? 6 + (params.steps || []).length * 7 + 7 : 14} dragId="dL" offsets={dimOff} setOffsets={setDimOff} />);
  }
  
  // Cutting l1 (skip for stepdrill)
  if (toolType !== "stepdrill" && params.showDiml1) {
    e.push(<DimH key="dl1" x1={cLeft} x2={tipR} y={dimBase} label={`${l1} mm`} tol={params.toll1} side="bottom" offset={6} dragId="dl1" offsets={dimOff} setOffsets={setDimOff} />);
  }
  // Neck l2 (only the straight part)
  if (l2 > 0 && params.showDiml2) {
    e.push(<DimH key="dl2" x1={tRight} x2={nRight} y={oy - Math.max(hD, hd)} label={`${l2} mm`} tol={params.toll2} side="top" offset={5} dragId="dl2" offsets={dimOff} setOffsets={setDimOff} />);
  }
  // Cutting diameter (skip for stepdrill)
  if (toolType !== "stepdrill" && params.showDimD) {
    e.push(<DimV key="dD" y1={oy - hD} y2={oy + hD} x={tipR} label={`⌀${D}`} tol={params.tolD} side="right" offset={5} dragId="dD" offsets={dimOff} setOffsets={setDimOff} />);
  }
  // Shank diameter if different
  if (Math.abs(D - d) > 0.1 && params.showDimd) {
    e.push(<DimV key="dd" y1={oy - hd} y2={oy + hd} x={sLeft} label={`⌀${d}`} tol={params.told} side="left" offset={5} dragId="dd" offsets={dimOff} setOffsets={setDimOff} />);
  }
  // Neck diameter
  if (l2 > 0 && params.showDimNeck) {
    e.push(<DimV key="dN" y1={oy - hN} y2={oy + hN} x={tRight + nL / 2} label={`⌀${nD}`} tol={params.tolNeck} side="left" offset={5} dragId="dN" offsets={dimOff} setOffsets={setDimOff} />);
  }
  // Corner R
  if (toolType === "bullnose" && rCorner > 0 && params.showDimAngles) {
    e.push(<Draggable id="dR" offsets={dimOff} setOffsets={setDimOff}><text key="dR" x={tipR - coR * 0.3} y={oy + hD + 5} fontSize={3.6} fontFamily="'IBM Plex Mono', monospace" fill={DC} fontWeight="600">R{rCorner}</text></Draggable>);
  }


  return <g>{e}</g>;
}

export { SideView };
