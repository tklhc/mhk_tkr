// DXF Export — generates 2D DXF from tool parameters
function generateDXF(params) {
  let { D, d, L, l1, l2, z, toolType, neckDia, neckAngle, dCore, rCorner, chamferSize, pointAngle } = params;
  if (toolType === "stepdrill") {
    const stps = params.steps || [];
    l1 = stps.reduce((s, st) => s + (st.len || 0), 0);
    l2 = 0;
    D = stps.length > 0 ? Math.max(...stps.map(s => s.dia)) : D;
  }
  const hD = D / 2, hd = d / 2;
  const nD = l2 > 0 ? neckDia : D;
  const hN = nD / 2;
  const aRad = (neckAngle * Math.PI) / 180;
  const transDx = (l2 > 0 && d > nD) ? ((d - nD) / 2) / Math.tan(aRad) : 0;
  const sL = L - l1 - l2 - transDx;

  // Coordinate system: origin at shank left, Y up
  const sLeft = 0, sRight = sL, tRight = sRight + transDx, nRight = tRight + l2;
  const cLeft = nRight, tipR = L;

  const entities = [];
  let handle = 100;
  const h = () => (handle++).toString(16).toUpperCase();

  const addLine = (x1,y1,x2,y2,layer="0",color=7) => {
    entities.push(`0\nLINE\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${x1.toFixed(4)}\n20\n${y1.toFixed(4)}\n30\n0\n11\n${x2.toFixed(4)}\n21\n${y2.toFixed(4)}\n31\n0`);
  };
  const addCircle = (cx,cy,r,layer="0",color=7) => {
    entities.push(`0\nCIRCLE\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${cx.toFixed(4)}\n20\n${cy.toFixed(4)}\n30\n0\n40\n${r.toFixed(4)}`);
  };
  const addText = (x,y,height,txt,layer="DIM",color=1) => {
    entities.push(`0\nTEXT\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${x.toFixed(4)}\n20\n${y.toFixed(4)}\n30\n0\n40\n${height.toFixed(4)}\n1\n${txt}`);
  };

  // Shank
  if (sL > 0) {
    addLine(sLeft, hd, sRight, hd, "CONTOUR", 7);
    addLine(sLeft, -hd, sRight, -hd, "CONTOUR", 7);
    addLine(sLeft, -hd, sLeft, hd, "CONTOUR", 7);
  }
  // Transition
  if (l2 > 0 && transDx > 0) {
    addLine(sRight, hd, tRight, hN, "CONTOUR", 7);
    addLine(sRight, -hd, tRight, -hN, "CONTOUR", 7);
  }
  // Neck
  if (l2 > 0) {
    addLine(tRight, hN, nRight, hN, "CONTOUR", 7);
    addLine(tRight, -hN, nRight, -hN, "CONTOUR", 7);
  }
  // Cutting section
  if (toolType === "drill") {
    const ptAng = (pointAngle || 140) * Math.PI / 180;
    const tipDx = hD / Math.tan(ptAng / 2);
    addLine(cLeft, hD, tipR - tipDx, hD, "CONTOUR", 7);
    addLine(cLeft, -hD, tipR - tipDx, -hD, "CONTOUR", 7);
    addLine(tipR - tipDx, hD, tipR, 0, "CONTOUR", 7);
    addLine(tipR - tipDx, -hD, tipR, 0, "CONTOUR", 7);
  } else if (toolType === "ballnose") {
    addLine(cLeft, hD, tipR - hD, hD, "CONTOUR", 7);
    addLine(cLeft, -hD, tipR - hD, -hD, "CONTOUR", 7);
    // Approximate ball nose arc with lines
    for (let a = -90; a < 90; a += 5) {
      const a1 = a * Math.PI / 180, a2 = (a + 5) * Math.PI / 180;
      addLine(tipR - hD + hD * Math.cos(a1), hD * Math.sin(a1), tipR - hD + hD * Math.cos(a2), hD * Math.sin(a2), "CONTOUR", 7);
    }
  } else {
    addLine(cLeft, hD, tipR, hD, "CONTOUR", 7);
    addLine(cLeft, -hD, tipR, -hD, "CONTOUR", 7);
    addLine(tipR, -hD, tipR, hD, "CONTOUR", 7);
  }
  // Steps between sections
  if (l2 > 0 && Math.abs(hD - hN) > 0.01) {
    addLine(nRight, hN, nRight, hD, "CONTOUR", 7);
    addLine(nRight, -hN, nRight, -hD, "CONTOUR", 7);
  } else if (l2 === 0 && Math.abs(hD - hd) > 0.01) {
    addLine(sRight, hd, sRight, hD, "CONTOUR", 7);
    addLine(sRight, -hd, sRight, -hD, "CONTOUR", 7);
  }
  // Center line
  addLine(sLeft - 2, 0, tipR + 2, 0, "CENTER", 1);
  // Core hidden lines
  if (dCore > 0 && dCore < D) {
    addLine(cLeft, dCore/2, tipR, dCore/2, "HIDDEN", 3);
    addLine(cLeft, -dCore/2, tipR, -dCore/2, "HIDDEN", 3);
  }
  // End view circle
  const ecx = tipR + D + 10;
  addCircle(ecx, 0, hD, "CONTOUR", 7);
  if (dCore > 0) addCircle(ecx, 0, dCore / 2, "HIDDEN", 3);

  // Dimensions as text
  addText(sLeft, -hd - 4, 2, `L = ${L} mm`, "DIM", 1);
  addText(cLeft, -hD - 4, 2, `l1 = ${l1} mm`, "DIM", 1);
  addText(tipR + 2, hD / 2, 2, `D = ${D} mm`, "DIM", 1);
  if (Math.abs(D - d) > 0.1) addText(sLeft - 15, hd / 2, 2, `d = ${d} mm`, "DIM", 1);
  addText(sLeft, hd + 3, 1.5, params.toolName || "", "DIM", 5);

  // Build DXF
  const dxf = [
    "0\nSECTION\n2\nHEADER",
    "9\n$ACADVER\n1\nAC1015",
    "9\n$INSUNITS\n70\n4",
    "0\nENDSEC",
    "0\nSECTION\n2\nTABLES",
    "0\nTABLE\n2\nLAYER\n70\n4",
    "0\nLAYER\n2\nCONTOUR\n70\n0\n62\n7\n6\nContinuous",
    "0\nLAYER\n2\nCENTER\n70\n0\n62\n1\n6\nContinuous",
    "0\nLAYER\n2\nHIDDEN\n70\n0\n62\n3\n6\nContinuous",
    "0\nLAYER\n2\nDIM\n70\n0\n62\n1\n6\nContinuous",
    "0\nENDTAB\n0\nENDSEC",
    "0\nSECTION\n2\nENTITIES",
    ...entities,
    "0\nENDSEC\n0\nEOF"
  ].join("\n");

  return dxf;
}

export { generateDXF };
