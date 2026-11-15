import { takimProfili, tamKontur } from "../geometry/profil";

// DXF Export — 2D DXF, kontur geometri modelinden (src/geometry/profil.js) gelir.
// Koordinat sistemi: orijin sap ucunda, eksen x, yarıçap y (yukarı), birim mm.
function generateDXF(params) {
  const g = takimProfili(params);
  const { D, d, L, l1 } = g;
  const { dCore } = params;
  const hD = D / 2, hd = d / 2;
  const sLeft = 0, cLeft = g.x.boyunSonu, tipR = L;

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

  // DXF ARC her zaman başlangıç açısından bitiş açısına saat yönünün tersine gider
  const addArc = (cx,cy,r,a1,a2,layer="0",color=7) => {
    const bas = ((Math.min(a1, a2) % 360) + 360) % 360;
    const bit = bas + Math.abs(a2 - a1);
    entities.push(`0\nARC\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${cx.toFixed(4)}\n20\n${cy.toFixed(4)}\n30\n0\n40\n${r.toFixed(4)}\n50\n${bas.toFixed(4)}\n51\n${(bit % 360).toFixed(4)}`);
  };

  // Dış kontur (kapalı)
  for (const s of tamKontur(g)) {
    if (s.t === "A") addArc(s.cx, s.cy, s.r, s.a1, s.a2, "CONTOUR", 7);
    else addLine(s.x1, s.y1, s.x2, s.y2, "CONTOUR", 7);
  }
  // Görünür kenarlar (çap değişimi, koni başlangıcı)
  for (const k of g.kenarlar) addLine(k.x, -k.r, k.x, k.r, "CONTOUR", 7);
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
