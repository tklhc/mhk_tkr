import { takimProfili, tamKontur } from "../geometry/profil";
import { toleransCoz, sapmaYaz } from "../geometry/tolerans";

// DXF dışa aktarma (AC1015 / R2000) — kontur, eksen, ölçüler, uçtan görünüş. Kontur geometri modelinden
// (src/geometry/profil.js) gelir. Koordinat sistemi: orijin sap ucunda, eksen x, yarıçap y (yukarı), birim mm.
// Katmanlar: CONTOUR (görünür kontur), CENTER (eksen, çizgi-nokta), HIDDEN (çekirdek, kesik), DIM (ölçüler), TEXT.
// Ölçüler gerçek DIMENSION nesnesi değil, çizgi + dolu ok + yazı olarak yazılır: her CAD programında aynı görünür,
// ama ölçü değeri düzenlenemez/ilişkili değildir.

const f = (v) => (+v).toFixed(4);
const fmt = (v) => String(Math.round(+v * 1000) / 1000).replace(".", ",");

/** Ölçü yazısı: ⌀ → %%c, ISO sınıfı ve sapmalar yan yana ("%%c10 h6 (0 / -0,009)"). */
export function olcuMetni(deger, { onEk = "", tol, anma } = {}) {
  let m = `${onEk === "⌀" ? "%%c" : onEk}${fmt(deger)}`;
  const t = toleransCoz(tol, anma ?? deger);
  if (t?.tur === "iso") m += ` ${t.sinif}${t.ust != null ? ` (${sapmaYaz(t.ust)} / ${sapmaYaz(t.alt)})` : ""}`;
  else if (t?.tur === "simetrik") m += ` %%p${fmt(t.ust)}`;
  else if (t?.tur === "sapma") m += ` (${sapmaYaz(t.ust)} / ${sapmaYaz(t.alt)})`;
  else if (tol && String(tol).trim()) m += ` ${String(tol).trim()}`;
  return m.replace(/\n/g, " ");
}

function generateDXF(params) {
  const g = takimProfili(params);
  const { D, d, L } = g;
  const { dCore } = params;
  const hD = D / 2, hd = d / 2;
  const hmax = Math.max(hD, hd);

  const entities = [];
  let handle = 100;
  const h = () => (handle++).toString(16).toUpperCase();

  const addLine = (x1, y1, x2, y2, layer = "0", color = 7) => {
    entities.push(`0\nLINE\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${f(x1)}\n20\n${f(y1)}\n30\n0\n11\n${f(x2)}\n21\n${f(y2)}\n31\n0`);
  };
  const addCircle = (cx, cy, r, layer = "0", color = 7) => {
    entities.push(`0\nCIRCLE\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${f(cx)}\n20\n${f(cy)}\n30\n0\n40\n${f(r)}`);
  };
  /** Ortalı yazı (72=1, 73=0): (x, y) taban çizgisinin ortası; aci derece. */
  const addText = (x, y, height, txt, layer = "TEXT", color = 7, aci = 0, orta = false) => {
    const hiza = orta ? `\n72\n1\n11\n${f(x)}\n21\n${f(y)}\n31\n0` : "";
    entities.push(`0\nTEXT\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${f(x)}\n20\n${f(y)}\n30\n0\n40\n${f(height)}\n1\n${txt}${aci ? `\n50\n${f(aci)}` : ""}${hiza}`);
  };
  /** Dolu ok: ucu (x, y), (ux, uy) yönüne bakar. */
  const addOk = (x, y, ux, uy, boy = 2.6, yari = 0.7) => {
    const n = Math.hypot(ux, uy) || 1, ax = ux / n, ay = uy / n;
    const bx = x - ax * boy, by = y - ay * boy;
    const p2 = [bx - ay * yari, by + ax * yari], p3 = [bx + ay * yari, by - ax * yari];
    entities.push(`0\nSOLID\n5\n${h()}\n8\nDIM\n62\n7\n10\n${f(x)}\n20\n${f(y)}\n30\n0\n11\n${f(p2[0])}\n21\n${f(p2[1])}\n31\n0\n12\n${f(p3[0])}\n22\n${f(p3[1])}\n32\n0\n13\n${f(p3[0])}\n23\n${f(p3[1])}\n33\n0`);
  };

  // DXF ARC her zaman başlangıç açısından bitiş açısına saat yönünün tersine gider
  const addArc = (cx, cy, r, a1, a2, layer = "0", color = 7) => {
    const bas = ((Math.min(a1, a2) % 360) + 360) % 360;
    const bit = bas + Math.abs(a2 - a1);
    entities.push(`0\nARC\n5\n${h()}\n8\n${layer}\n62\n${color}\n10\n${f(cx)}\n20\n${f(cy)}\n30\n0\n40\n${f(r)}\n50\n${f(bas)}\n51\n${f(bit % 360)}`);
  };

  /** Yatay ölçü: p1, p2 ölçülen noktaların (x, y) değerleri; ölçü çizgisi y = konum. */
  const olcuYatay = (x1, y1, x2, y2, konum, metin) => {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    if (hi - lo < 0.2) return;
    const yon = konum < Math.min(y1, y2) ? -1 : 1;
    for (const [x, y] of [[x1, y1], [x2, y2]]) addLine(x, y + yon, x, konum + yon * 2, "DIM", 7);
    addLine(lo, konum, hi, konum, "DIM", 7);
    addOk(lo, konum, -1, 0); addOk(hi, konum, 1, 0);
    addText((lo + hi) / 2, konum + 1, 3.5, metin, "DIM", 7, 0, true);
  };
  /** Dikey ölçü: ölçü çizgisi x = konum; yazı yukarı döner (90°). */
  const olcuDikey = (x1, y1, x2, y2, konum, metin) => {
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    if (hi - lo < 0.2) return;
    const yon = konum < Math.min(x1, x2) ? -1 : 1;
    for (const [x, y] of [[x1, y1], [x2, y2]]) addLine(x + yon, y, konum + yon * 2, y, "DIM", 7);
    addLine(konum, lo, konum, hi, "DIM", 7);
    addOk(konum, lo, 0, -1); addOk(konum, hi, 0, 1);
    addText(konum - 1, (lo + hi) / 2, 3.5, metin, "DIM", 7, 90, true);
  };

  // Dış kontur (kapalı)
  for (const s of tamKontur(g)) {
    if (s.t === "A") addArc(s.cx, s.cy, s.r, s.a1, s.a2, "CONTOUR", 7);
    else addLine(s.x1, s.y1, s.x2, s.y2, "CONTOUR", 7);
  }
  // Görünür kenarlar (çap değişimi, koni başlangıcı)
  for (const k of g.kenarlar) addLine(k.x, -k.r, k.x, k.r, "CONTOUR", 7);
  // Eksen
  addLine(-2, 0, L + 2, 0, "CENTER", 1);
  // Çekirdek (kesik)
  const cLeft = g.x.boyunSonu;
  if (dCore > 0 && dCore < D) {
    addLine(cLeft, dCore / 2, L, dCore / 2, "HIDDEN", 3);
    addLine(cLeft, -dCore / 2, L, -dCore / 2, "HIDDEN", 3);
  }
  // Uçtan görünüş: dış çap, çekirdek, eksen çizgileri
  const ecx = L + D + 30;
  addCircle(ecx, 0, hD, "CONTOUR", 7);
  if (dCore > 0 && dCore < D) addCircle(ecx, 0, dCore / 2, "HIDDEN", 3);
  addLine(ecx - hD - 2, 0, ecx + hD + 2, 0, "CENTER", 1);
  addLine(ecx, -hD - 2, ecx, hD + 2, "CENTER", 1);
  addText(ecx, -hD - 7, 3, `UCTAN GORUNUS  ${params.z} Z`, "TEXT", 7, 0, true);

  // ── Ölçüler ──
  const stepdrill = g.tip === "stepdrill";
  const yAlt = -hmax;
  if (!stepdrill && params.showDiml1 !== false) {
    olcuYatay(g.x.boyunSonu, -hD, L, -hD, yAlt - 7, olcuMetni(g.l1, { tol: params.toll1, anma: g.l1 }));
  }
  if (stepdrill && params.kademeOlcu === "toplam" && params.showDiml1 !== false) {
    olcuYatay(L - g.l1, hmax, L, hmax, hmax + 7, olcuMetni(g.l1, { tol: params.toll1, anma: g.l1 }));
  }
  if (params.showDimL !== false) {
    olcuYatay(0, -hd, L, -hD, yAlt - (stepdrill ? 7 : 14), olcuMetni(L, { tol: params.tolL, anma: L }));
  }
  if (g.l2 > 0 && params.showDiml2 !== false) {
    olcuYatay(g.x.gecisSonu, hD, g.x.boyunSonu, hD, hmax + 7, olcuMetni(g.l2, { tol: params.toll2, anma: g.l2 }));
  }
  if (!stepdrill && params.showDimD !== false) {
    olcuDikey(L, hD, L, -hD, L + 10, olcuMetni(D, { onEk: "⌀", tol: params.tolD, anma: D }));
  }
  if (stepdrill && params.showDimD !== false) {
    for (const [i, kd] of g.kademeler.entries()) {
      if (params.kademeOlcu === "toplam" && i > 0 && Math.abs(kd.dia - d) < 1e-9) continue;
      const xm = (kd.sol + kd.sag - kd.gecisBoyu) / 2;
      olcuDikey(xm, kd.dia / 2, xm, -kd.dia / 2, xm, olcuMetni(kd.dia, { onEk: "⌀", tol: kd.tolDia, anma: kd.dia }));
    }
  }
  if (params.showDimd !== false) {
    olcuDikey(0, hd, 0, -hd, -10, olcuMetni(d, { onEk: "⌀", tol: params.told, anma: d }));
  }
  if (g.l2 > 0 && params.showDimNeck !== false) {
    const xm = (g.x.gecisSonu + g.x.boyunSonu) / 2;
    olcuDikey(xm, g.nD / 2, xm, -g.nD / 2, xm + 4, olcuMetni(g.nD, { onEk: "⌀", tol: params.tolNeck, anma: g.nD }));
  }
  // Açı yazıları (helis, uç açısı, köşe radyüsü, pah): tek satır, ölçüsüz
  const notlar = [];
  if (params.helix > 0 && g.tip !== "stepdrill") notlar.push(`Helis ${fmt(params.helix)}%%d ${params.helixHand === "Sol" ? "Sol" : "Sag"}`);
  if (g.tip === "drill") notlar.push(`Uc acisi ${fmt(params.pointAngle || 140)}%%d`);
  if (g.tip === "bullnose" && params.rCorner > 0) notlar.push(`R${fmt(params.rCorner)}`);
  if ((g.tip === "chamfer" || g.tip === "reamer" || g.tip === "flat") && params.chamferSize > 0) notlar.push(`Pah ${fmt(params.chamferSize)}x45%%d`);
  notlar.forEach((n, i) => addText(0, hmax + 14 + 5 * i, 3.5, n, "DIM", 7));

  addText(0, hmax + 10 + 5 * notlar.length + 4, 4, params.toolName || "", "TEXT", 5);

  const ltype = (ad, aciklama, desen) => {
    const toplam = desen.reduce((t, v) => t + Math.abs(v), 0);
    return `0\nLTYPE\n2\n${ad}\n70\n0\n3\n${aciklama}\n72\n65\n73\n${desen.length}\n40\n${f(toplam)}${desen.map((v) => `\n49\n${f(v)}\n74\n0`).join("")}`;
  };
  const katman = (ad, renk, tip) => `0\nLAYER\n2\n${ad}\n70\n0\n62\n${renk}\n6\n${tip}`;

  return [
    "0\nSECTION\n2\nHEADER",
    "9\n$ACADVER\n1\nAC1015",
    "9\n$INSUNITS\n70\n4",
    "0\nENDSEC",
    "0\nSECTION\n2\nTABLES",
    "0\nTABLE\n2\nLTYPE\n70\n3",
    ltype("CONTINUOUS", "Solid line", []),
    ltype("CENTER", "Center ____ _ ____ _", [12, -1.5, 0.6, -1.5]),
    ltype("HIDDEN", "Hidden __ __ __", [3, -1]),
    "0\nENDTAB",
    "0\nTABLE\n2\nLAYER\n70\n5",
    katman("CONTOUR", 7, "CONTINUOUS"),
    katman("CENTER", 1, "CENTER"),
    katman("HIDDEN", 3, "HIDDEN"),
    katman("DIM", 7, "CONTINUOUS"),
    katman("TEXT", 7, "CONTINUOUS"),
    "0\nENDTAB\n0\nENDSEC",
    "0\nSECTION\n2\nENTITIES",
    ...entities,
    "0\nENDSEC\n0\nEOF",
  ].join("\n");
}

export { generateDXF };
