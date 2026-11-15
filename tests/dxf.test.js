import { describe, it, expect } from "vitest";
import { generateDXF } from "../src/io/dxf.js";
import { DEFAULT_PARAMS } from "../src/constants.js";

const p = (ek) => ({ ...DEFAULT_PARAMS, ...ek });

/** DXF ENTITIES bölümünü {tip, katman, kodlar} listesine çevirir. */
function nesneler(dxf) {
  const satir = dxf.split("\n");
  const bas = satir.findIndex((s, i) => s === "ENTITIES" && satir[i - 1] === "2");
  const out = [];
  let cur = null;
  for (let i = bas + 1; i < satir.length - 1; i += 2) {
    const kod = satir[i].trim(), deger = satir[i + 1];
    if (kod === "0") {
      if (deger === "ENDSEC") break;
      cur = { tip: deger, k: {} };
      out.push(cur);
    } else if (cur) cur.k[kod] = deger;
  }
  return out;
}

/** CONTOUR katmanındaki uç noktalar: kontur kapalıysa her nokta çift sayıda geçer. */
function konturKapali(liste) {
  const say = new Map();
  const ekle = (x, y) => {
    const anahtar = `${(+x).toFixed(3)},${(+y).toFixed(3)}`.replace(/-0\.000/g, "0.000");
    say.set(anahtar, (say.get(anahtar) || 0) + 1);
  };
  for (const n of liste) {
    if (n.k["8"] !== "CONTOUR") continue;
    if (n.tip === "LINE") {
      // Görünür kenar çizgisi (x sabit, -r'den +r'ye): konturun parçası değil
      const kenar = +n.k["10"] === +n.k["11"] && +n.k["20"] === -n.k["21"] && +n.k["20"] !== 0;
      if (kenar) continue;
      ekle(n.k["10"], n.k["20"]); ekle(n.k["11"], n.k["21"]);
    }
    if (n.tip === "ARC") {
      const cx = +n.k["10"], cy = +n.k["20"], r = +n.k["40"];
      for (const a of [+n.k["50"], +n.k["51"]]) ekle(cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180));
    }
  }
  return [...say.entries()].filter(([, n]) => n % 2 !== 0).map(([k]) => k);
}

describe("DXF", () => {
  it("dosya yapısı: HEADER, TABLES, ENTITIES, EOF", () => {
    const dxf = generateDXF(p({}));
    expect(dxf).toMatch(/^0\nSECTION\n2\nHEADER/);
    expect(dxf.trim().endsWith("EOF")).toBe(true);
  });

  it("radyüs freze: köşeler ARC olarak yazılır, kontur kapalı", () => {
    const n = nesneler(generateDXF(p({ toolType: "bullnose", D: 12, d: 12, L: 75, l1: 30, rCorner: 1 })));
    const yaylar = n.filter((x) => x.tip === "ARC" && x.k["8"] === "CONTOUR");
    expect(yaylar).toHaveLength(2);
    expect(yaylar.map((y) => [+y.k["50"], +y.k["51"]])).toEqual([[0, 90], [270, 0]]);
    expect(konturKapali(n)).toEqual([]);
  });

  it("küre freze: uç tek parça yarım daire değil, iki çeyrek yay", () => {
    const n = nesneler(generateDXF(p({ toolType: "ballnose", D: 8, d: 8, L: 60, l1: 20 })));
    expect(n.filter((x) => x.tip === "ARC" && x.k["8"] === "CONTOUR")).toHaveLength(2);
    expect(konturKapali(n)).toEqual([]);
  });

  it("pah freze: uçta pah çizgisi var", () => {
    const n = nesneler(generateDXF(p({ toolType: "chamfer", D: 10, d: 10, L: 60, l1: 20, chamferSize: 3 })));
    const pah = n.find((x) => x.tip === "LINE" && +x.k["10"] === 57 && +x.k["20"] === 5);
    expect(pah && [+pah.k["11"], +pah.k["21"]]).toEqual([60, 2]);
    expect(konturKapali(n)).toEqual([]);
  });

  it("kademeli matkap: uç sivri, düz alın yok", () => {
    const n = nesneler(generateDXF(p({ toolType: "stepdrill", d: 12, L: 90, steps: [{ dia: 10, len: 15, angle: 140 }, { dia: 14, len: 15, angle: 90 }] })));
    const ucDik = n.filter((x) => x.tip === "LINE" && x.k["8"] === "CONTOUR" && +x.k["10"] === 90 && +x.k["11"] === 90);
    expect(ucDik).toHaveLength(0);
    expect(konturKapali(n)).toEqual([]);
  });

  for (const tip of ["flat", "drill"]) {
    it(`${tip}: kontur kapalı`, () => {
      expect(konturKapali(nesneler(generateDXF(p({ toolType: tip, l2: 12, L: 100, neckDia: 8.5 }))))).toEqual([]);
    });
  }
});

import { olcuMetni } from "../src/io/dxf.js";

describe("DXF: katmanlar, çizgi tipleri, ölçüler", () => {
  const dxf = generateDXF(p({ tolD: "h6", told: "h6", tolL: "±0.1", toll1: "" }));
  const n = nesneler(dxf);
  it("CENTER ve HIDDEN çizgi tipleri tanımlı ve katmanlara bağlı", () => {
    expect(dxf).toMatch(/0\nLTYPE\n2\nCENTER\n/);
    expect(dxf).toMatch(/0\nLTYPE\n2\nHIDDEN\n/);
    expect(dxf).toMatch(/0\nLAYER\n2\nCENTER\n70\n0\n62\n1\n6\nCENTER/);
    expect(dxf).toMatch(/0\nLAYER\n2\nHIDDEN\n70\n0\n62\n3\n6\nHIDDEN/);
    expect(dxf).toMatch(/0\nLAYER\n2\nDIM\n/);
  });
  it("ölçüler DIM katmanında: çizgi, dolu ok (SOLID) ve yazı", () => {
    expect(n.filter((x) => x.tip === "LINE" && x.k["8"] === "DIM").length).toBeGreaterThan(8);
    expect(n.filter((x) => x.tip === "SOLID").length).toBeGreaterThanOrEqual(8);
    const yazilar = n.filter((x) => x.tip === "TEXT" && x.k["8"] === "DIM").map((x) => x.k["1"]);
    expect(yazilar.some((t) => t.startsWith("%%c10") && t.includes("h6"))).toBe(true);
    expect(yazilar).toContain("75 %%p0,1");
  });
  it("dikey ölçü yazısı 90° döner; ortalı yazıda hizalama noktası var", () => {
    const dikey = n.find((x) => x.tip === "TEXT" && x.k["1"].startsWith("%%c10"));
    expect(+dikey.k["50"]).toBe(90);
    expect(dikey.k["72"]).toBe("1");
    expect(dikey.k["11"]).toBeDefined();
  });
  it("kapalı kontur ölçüler yüzünden bozulmaz; eksen CENTER katmanında", () => {
    expect(konturKapali(n)).toEqual([]);
    expect(n.some((x) => x.tip === "LINE" && x.k["8"] === "CENTER")).toBe(true);
  });
  it("kapatılan ölçü gösterimi DXF'e de yansır", () => {
    const k = nesneler(generateDXF(p({ showDimL: false, showDimD: false, showDimd: false, showDiml1: false })));
    expect(k.filter((x) => x.tip === "SOLID")).toHaveLength(0);
  });
  it("ölçü metni: ⌀ → %%c, sapmalar, tanınmayan tolerans olduğu gibi", () => {
    expect(olcuMetni(10, { onEk: "⌀", tol: "h6", anma: 10 })).toMatch(/^%%c10 h6 \(0 \/ −0,009\)$|^%%c10 h6 \(0 \/ -0,009\)$/);
    expect(olcuMetni(25, { tol: "+0.02/-0.01", anma: 25 })).toContain("/");
    expect(olcuMetni(8.5, {})).toBe("8,5");
    expect(olcuMetni(5, { tol: "özel", anma: 5 })).toBe("5 özel");
  });
  it("hiçbir yazı NaN ya da undefined içermez", () => {
    expect(dxf).not.toMatch(/NaN|undefined/);
  });
});
