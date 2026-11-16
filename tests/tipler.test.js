import { describe, it, expect } from "vitest";
import { tipDegistir, TIP_LISTESI } from "../src/geometry/tipler.js";
import { takimProfili } from "../src/geometry/profil.js";
import { DEFAULT_PARAMS } from "../src/constants.js";

const OLCULER = [
  { D: 10, d: 10, L: 75 },
  { D: 3, d: 3, L: 40 },
  { D: 20, d: 25, L: 120 },
  { D: 16, d: 10, L: 80 },   // baş sapdan kalın (T-freze gibi)
];

describe("tip geçişi", () => {
  it("T-frezeden matkaba geçince boğaz kalmaz", () => {
    const tslot = tipDegistir({ ...DEFAULT_PARAMS }, "tslot");
    expect(tslot.l2).toBeGreaterThan(0);
    const matkap = tipDegistir(tslot, "drill");
    expect(matkap.toolType).toBe("drill");
    expect(matkap.l2).toBe(0);
    expect(matkap.z).toBe(2);
    expect(matkap.pointAngle).toBe(140);
    expect(takimProfili(matkap).l2).toBe(0);
    expect(takimProfili(matkap).hatalar).toEqual([]);
  });

  it("önceki tipe ait radyüs, pah ve uç çapı sıfırlanır", () => {
    const rad = tipDegistir(DEFAULT_PARAMS, "bullnose");
    expect(rad.rCorner).toBeGreaterThan(0);
    expect(tipDegistir(rad, "flat").rCorner).toBe(0);
    const pah = tipDegistir(DEFAULT_PARAMS, "chamfer");
    expect(tipDegistir(pah, "ballnose").chamferSize).toBe(0);
    const konik = tipDegistir(DEFAULT_PARAMS, "taperreamer");
    expect(konik.tipD).toBeGreaterThan(0);
    expect(tipDegistir(konik, "flat").tipD).toBe(0);
  });

  it("ana ölçüler ve belge bilgileri korunur", () => {
    const p = { ...DEFAULT_PARAMS, D: 12, d: 12, L: 90, tolD: "h7", toolName: "ÖZEL-1", material: "HSS", drawingNo: "A-12", customerName: "X", sapTipi: "HB", coolantHole: true };
    const s = tipDegistir(p, "drill");
    expect(s).toMatchObject({ D: 12, d: 12, L: 90, tolD: "h7", toolName: "ÖZEL-1", material: "HSS", drawingNo: "A-12", customerName: "X", sapTipi: "HB", coolantHole: true });
  });

  it("aynı tipe geçiş parametreleri değiştirmez", () => {
    const p = { ...DEFAULT_PARAMS, l1: 33, z: 5 };
    expect(tipDegistir(p, "flat")).toEqual(p);
  });

  it("kademeliye geçince kademeler çapa göre kurulur", () => {
    const s = tipDegistir({ ...DEFAULT_PARAMS, D: 8 }, "stepdrill");
    expect(s.steps).toHaveLength(2);
    expect(s.steps[0].dia).toBe(8);
    expect(s.steps[1].dia).toBeGreaterThan(8);
  });

  // 9 × 9 geçiş, 4 ölçü setiyle: sonuç her zaman geometrik olarak geçerli olmalı
  for (const olcu of OLCULER) {
    for (const nereden of TIP_LISTESI) {
      for (const nereye of TIP_LISTESI) {
        if (nereden === nereye) continue;
        it(`⌀${olcu.D}/${olcu.d}×${olcu.L}: ${nereden} → ${nereye} geçerli`, () => {
          const baslangic = tipDegistir({ ...DEFAULT_PARAMS, ...olcu, toolType: "flat" }, nereden);
          const sonuc = tipDegistir(baslangic, nereye);
          expect(takimProfili(sonuc).hatalar).toEqual([]);
        });
      }
    }
  }
});
