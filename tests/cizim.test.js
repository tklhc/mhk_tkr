import { describe, it, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { tarihYaz } from "../src/drawing/Antet.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { parseCSV, generateCSVTemplate } from "../src/io/csv.js";

const render = (params) => renderToStaticMarkup(h(Sayfa, { params, dimOff: {}, setDimOff: () => {} }));

describe("Sayfa çizimi", () => {
  const takimlar = parseCSV(generateCSVTemplate());

  for (const kagit of ["A4", "A3"]) {
    for (const t of takimlar) {
      it(`${t.toolName} (${kagit}): çizilir, NaN/undefined yok`, () => {
        const svg = render({ ...t, kagit });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        expect(svg).toContain(t.toolName);
      });
    }
  }

  it("A4 yatay viewBox mm cinsinden", () => {
    expect(render({ ...DEFAULT_PARAMS })).toContain('viewBox="0 0 297 210"');
    expect(render({ ...DEFAULT_PARAMS, kagit: "A3" })).toContain('viewBox="0 0 420 297"');
  });

  it("toleranslı ölçü sayısal sapmayla yazılır (h6 → 0 / −0,009)", () => {
    const svg = render({ ...DEFAULT_PARAMS, D: 10, tolD: "h6" });
    expect(svg).toContain("h6");
    expect(svg).toContain("−0,009");
  });

  it("hatalı geometri çökmez", () => {
    for (const ek of [{ L: 0 }, { D: 0 }, { l1: 500 }, { steps: [] , toolType: "stepdrill" }, { z: 0 }, { dCore: 99 }]) {
      expect(() => render({ ...DEFAULT_PARAMS, ...ek })).not.toThrow();
    }
  });

  it("tarih biçimi", () => {
    expect(tarihYaz("2026-11-15")).toBe("15.11.2026");
    expect(tarihYaz("", new Date(2026, 0, 5))).toBe("05.01.2026");
  });
});

describe("yeni tipler ve sap detayı çizimi", () => {
  const ek = [
    { toolName: "R1", toolType: "reamer", D: 10, d: 10, L: 100, l1: 40, chamferSize: 0.5, helix: 0, z: 6 },
    { toolName: "K1", toolType: "taperreamer", D: 10, d: 10, L: 100, l1: 50, tipD: 9, helix: 0, z: 6 },
    { toolName: "T1", toolType: "tslot", D: 16, d: 10, L: 80, l1: 3, l2: 12, neckDia: 8, helix: 0 },
    { toolName: "HB1", D: 10, d: 10, L: 100, l1: 30, sapTipi: "HB" },
    { toolName: "HE1", D: 10, d: 10, L: 100, l1: 30, sapTipi: "HE", sapDuzUzunluk: 18, sapDuzDerinlik: 0.8 },
  ];
  for (const e of ek) {
    it(`${e.toolName}: çizilir, NaN yok`, () => {
      const svg = render({ ...DEFAULT_PARAMS, ...e });
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(svg).toContain(e.toolName);
    });
  }
  it("konik rayba koniklik oranını yazar", () => {
    expect(render({ ...DEFAULT_PARAMS, ...ek[1] })).toContain("Konik 1:50");
  });
  it("Weldon düzlüğü DIN 6535-HB etiketiyle", () => {
    expect(render({ ...DEFAULT_PARAMS, ...ek[3] })).toContain("DIN 6535-HB");
  });
});

import { detayOzelligi } from "../src/drawing/DetayA.jsx";
import { takimProfili } from "../src/geometry/profil.js";

describe("Detay A", () => {
  const ozel = (ek) => { const p = { ...DEFAULT_PARAMS, ...ek }; return detayOzelligi(p, takimProfili(p)); };
  it("radyüs frezede R etiketi ve merkez yay merkezinde", () => {
    const f = ozel({ toolType: "bullnose", D: 12, d: 12, L: 75, rCorner: 1 });
    expect(f.metin).toBe("R1");
    expect(f.cx).toBe(74);
    expect(f.cr).toBe(5);
  });
  it("pah ve rayba girişinde pah etiketi", () => {
    expect(ozel({ toolType: "chamfer", chamferSize: 3 }).metin).toBe("3×45°");
    expect(ozel({ toolType: "reamer", chamferSize: 0.5, helix: 0 }).metin).toBe("0,5×45°");
  });
  it("matkapta uç açısı", () => {
    expect(ozel({ toolType: "drill", pointAngle: 118 }).metin).toBe("118°");
  });
  it("düz frezede detay yok", () => {
    expect(ozel({ toolType: "flat" })).toBeNull();
  });
  it("sayfada: radyüs frezede DETAY A çizilir, düz frezede çizilmez", () => {
    const r = render({ ...DEFAULT_PARAMS, toolType: "bullnose", D: 12, d: 12, rCorner: 1 });
    expect(r).toMatch(/DETAY [AB] [(][0-9]+:1[)]/);
    expect(render({ ...DEFAULT_PARAMS, toolType: "flat" })).not.toContain("DETAY");
  });
});

import { kesitVarMi } from "../src/drawing/Kesit.jsx";

describe("Kesit A-A", () => {
  const dene = (ek) => { const p = { ...DEFAULT_PARAMS, ...ek }; return kesitVarMi(p, takimProfili(p)); };
  it("çekirdeği tanımlı kanallı takımda var, çekirdek 0 ise yok", () => {
    expect(dene({})).toBe(true);
    expect(dene({ dCore: 0 })).toBe(false);
    expect(dene({ kesitAA: false })).toBe(false);
  });
  it("sayfada kesme düzlemi ve taralı kesit çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS });
    expect(svg).toMatch(/KESİT A-A \(\d+:1\)/);
    expect(svg).toContain("kesit-tarama");
  });
  it("kesit varken detay harfi B olur", () => {
    const svg = render({ ...DEFAULT_PARAMS, toolType: "bullnose", D: 12, d: 12, rCorner: 1 });
    expect(svg).toContain("KESİT A-A");
    expect(svg).toMatch(/DETAY B/);
  });
  it("çekirdek yoksa kesit yok ve detay A kalır", () => {
    const svg = render({ ...DEFAULT_PARAMS, toolType: "bullnose", D: 12, d: 12, rCorner: 1, dCore: 0 });
    expect(svg).not.toContain("KESİT");
    expect(svg).toMatch(/DETAY A/);
  });
});
