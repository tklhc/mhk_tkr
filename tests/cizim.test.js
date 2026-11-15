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
