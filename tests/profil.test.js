import { describe, it, expect } from "vitest";
import { takimProfili, tamKontur, parcaUclari } from "../src/geometry/profil.js";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { parseCSV, generateCSVTemplate } from "../src/io/csv.js";

const p = (ek) => ({ ...DEFAULT_PARAMS, ...ek });

/** Kontur kesintisiz ve kapalı mı? */
function kesintisizVeKapali(kontur) {
  for (let i = 0; i < kontur.length; i++) {
    const a = parcaUclari(kontur[i]);
    const b = parcaUclari(kontur[(i + 1) % kontur.length]);
    const fark = Math.hypot(a.x2 - b.x1, a.y2 - b.y1);
    if (fark > 1e-6) return `parça ${i} ile ${(i + 1) % kontur.length} arasında ${fark.toFixed(4)} mm boşluk`;
  }
  return true;
}

describe("takimProfili istasyonları", () => {
  it("düz freze: sap = L - l1", () => {
    const g = takimProfili(p({ D: 10, d: 10, L: 75, l1: 25, l2: 0 }));
    expect(g.x).toEqual({ sapSonu: 50, gecisSonu: 50, boyunSonu: 50, uc: 75 });
    expect(g.hatalar).toEqual([]);
  });

  it("boğazlı freze: 45° geçiş boğaz boyuna dahil değil", () => {
    // d=10, boğaz ⌀8.5 → geçiş (10-8.5)/2 / tan45 = 0.75
    const g = takimProfili(p({ D: 10, d: 10, L: 100, l1: 30, l2: 12, neckDia: 8.5, neckAngle: 45 }));
    expect(g.gecisBoyu).toBeCloseTo(0.75, 9);
    expect(g.x.sapSonu).toBeCloseTo(100 - 30 - 12 - 0.75, 9);
    expect(g.x.boyunSonu).toBeCloseTo(70, 9);
  });

  it("kademeli matkap: kesici boy kademelerin toplamı, D en büyük kademe", () => {
    const g = takimProfili(p({
      toolType: "stepdrill", D: 1, d: 12, L: 90, l2: 20,
      steps: [{ dia: 10, len: 15, angle: 140 }, { dia: 14, len: 15, angle: 90 }],
    }));
    expect(g.l1).toBe(30);
    expect(g.l2).toBe(0);
    expect(g.D).toBe(14);
    expect(g.x.boyunSonu).toBe(60);
    expect(g.kademeler.map((k) => [k.sol, k.sag])).toEqual([[75, 90], [60, 75]]);
  });
});

describe("kontur", () => {
  const tipler = {
    "düz": { toolType: "flat" },
    "düz, sap ≠ çap": { toolType: "flat", D: 8, d: 10 },
    "boğazlı": { toolType: "flat", L: 100, l1: 30, l2: 12, neckDia: 8.5 },
    "boğaz açısız (90°)": { toolType: "flat", D: 10, d: 10, l2: 10, neckDia: 10 },
    "küre": { toolType: "ballnose", D: 8, d: 8, L: 60, l1: 20 },
    "radyüs": { toolType: "bullnose", D: 12, d: 12, rCorner: 1 },
    "radyüs 0": { toolType: "bullnose", D: 12, d: 12, rCorner: 0 },
    "pah": { toolType: "chamfer", chamferSize: 3 },
    "matkap": { toolType: "drill", pointAngle: 140 },
    "kademeli matkap": { toolType: "stepdrill", d: 12, steps: [{ dia: 10, len: 15, angle: 140 }, { dia: 14, len: 15, angle: 90 }] },
    "kademeli matkap, sap > kademe": { toolType: "stepdrill", d: 25, steps: [{ dia: 12, len: 15, angle: 140 }, { dia: 16, len: 15, angle: 90 }, { dia: 20, len: 15, angle: 90 }] },
  };
  for (const [ad, ek] of Object.entries(tipler)) {
    it(`${ad}: kesintisiz ve kapalı`, () => {
      expect(kesintisizVeKapali(tamKontur(takimProfili(p(ek))))).toBe(true);
    });
  }

  it("radyüs freze uçta yay içerir", () => {
    const g = takimProfili(p({ toolType: "bullnose", D: 12, d: 12, L: 75, rCorner: 1 }));
    const yay = g.ust.find((s) => s.t === "A");
    expect(yay).toMatchObject({ cx: 74, cy: 5, r: 1 });
  });

  it("pah frezenin ucu pahlı", () => {
    const g = takimProfili(p({ toolType: "chamfer", D: 10, d: 10, L: 60, l1: 20, chamferSize: 3 }));
    expect(g.ust).toContainEqual({ t: "L", x1: 57, y1: 5, x2: 60, y2: 2 });
  });

  it("matkap ucu 140° açıyla eksende biter", () => {
    const g = takimProfili(p({ toolType: "drill", D: 8, d: 8, L: 80, l1: 50, pointAngle: 140 }));
    const son = g.ust[g.ust.length - 1];
    expect(son.x2).toBe(80);
    expect(son.y2).toBe(0);
    expect(80 - son.x1).toBeCloseTo(4 / Math.tan(70 * Math.PI / 180), 9);
  });
});

describe("doğrulama", () => {
  const mesajlar = (ek) => takimProfili(p(ek)).hatalar.map((h) => h.alan);

  it("örnek şablondaki takımlar hatasız", () => {
    for (const t of parseCSV(generateCSVTemplate())) {
      expect({ ad: t.toolName, hatalar: takimProfili(t).hatalar }).toEqual({ ad: t.toolName, hatalar: [] });
    }
  });
  it("kesici + boğaz toplam boydan uzunsa", () => expect(mesajlar({ L: 30, l1: 25, l2: 10 })).toContain("L"));
  it("boğaz çapı sap çapından büyükse", () => expect(mesajlar({ l2: 10, neckDia: 12, d: 10 })).toContain("neckDia"));
  it("çekirdek çaptan büyükse", () => expect(mesajlar({ dCore: 10, D: 10 })).toContain("dCore"));
  it("köşe radyüsü yarıçaptan büyükse", () => expect(mesajlar({ toolType: "bullnose", D: 10, rCorner: 6 })).toContain("rCorner"));
  it("kademeler büyümüyorsa", () => {
    expect(mesajlar({ toolType: "stepdrill", steps: [{ dia: 14, len: 15, angle: 140 }, { dia: 10, len: 15, angle: 90 }] })).toContain("steps.1.dia");
  });
});

import { yaricapAt, parcaNoktalari } from "../src/geometry/profil.js";

describe("yaricapAt", () => {
  it("düz freze: sapta d/2, kesicide D/2, dışarıda 0", () => {
    const g = takimProfili(p({ D: 8, d: 10, L: 60, l1: 20 }));
    expect(yaricapAt(g, 10)).toBe(5);
    expect(yaricapAt(g, 50)).toBe(4);
    expect(yaricapAt(g, 40)).toBe(5); // basamakta büyük değer
    expect(yaricapAt(g, 61)).toBe(0);
  });
  it("küre freze: uçta 0, kürenin başında D/2", () => {
    const g = takimProfili(p({ toolType: "ballnose", D: 8, d: 8, L: 60, l1: 20 }));
    expect(yaricapAt(g, 56)).toBeCloseTo(4, 9);
    expect(yaricapAt(g, 60)).toBeCloseTo(0, 6);
    expect(yaricapAt(g, 58)).toBeCloseTo(Math.sqrt(16 - 4), 9);
  });
  it("radyüs freze: uçta D/2 - R", () => {
    const g = takimProfili(p({ toolType: "bullnose", D: 12, d: 12, L: 75, rCorner: 2 }));
    expect(yaricapAt(g, 75)).toBeCloseTo(4, 9);
    expect(yaricapAt(g, 72)).toBeCloseTo(6, 9);
  });
  it("matkap ucu doğrusal azalır", () => {
    const g = takimProfili(p({ toolType: "drill", D: 8, d: 8, L: 80, l1: 50, pointAngle: 140 }));
    expect(yaricapAt(g, 80)).toBeCloseTo(0, 9);
    const ucBoyu = 4 / Math.tan(70 * Math.PI / 180);
    expect(yaricapAt(g, 80 - ucBoyu)).toBeCloseTo(4, 9);
    expect(yaricapAt(g, 80 - ucBoyu / 2)).toBeCloseTo(2, 9);
  });
  it("kademeli matkap: her kademede kendi çapı", () => {
    const g = takimProfili(p({ toolType: "stepdrill", d: 12, L: 90, steps: [{ dia: 10, len: 15, angle: 140 }, { dia: 14, len: 15, angle: 90 }] }));
    expect(yaricapAt(g, 80)).toBe(5);
    expect(yaricapAt(g, 65)).toBe(7);
  });
  it("parcaNoktalari: yay uçları doğru", () => {
    const pts = parcaNoktalari({ t: "A", cx: 10, cy: 0, r: 4, a1: 90, a2: 0 });
    expect(pts[0][0]).toBeCloseTo(10, 9); expect(pts[0][1]).toBeCloseTo(4, 9);
    expect(pts[pts.length - 1][0]).toBeCloseTo(14, 9); expect(pts[pts.length - 1][1]).toBeCloseTo(0, 9);
  });
});
