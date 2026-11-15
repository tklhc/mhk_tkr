import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { tolSembolVar, SALGI_UST_EK } from "../src/drawing/ToleransSembolleri.jsx";
import { Sayfa, duzenHesapla } from "../src/drawing/Sayfa.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";

const render = (p, dimOff = {}) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff, setDimOff: () => {} }));

describe("salgı işareti", () => {
  it("varsayılan resimde yok", () => {
    expect(tolSembolVar(DEFAULT_PARAMS)).toBe(false);
    expect(render(DEFAULT_PARAMS)).not.toContain("↗");
  });
  it("boşluklu girdi boş sayılır", () => {
    expect(tolSembolVar({ ...DEFAULT_PARAMS, salgi: "  " })).toBe(false);
  });
  it("salgı girilince çerçeve (değer + A) ve sap üstünde A datumu çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, salgi: "0,01" });
    expect(svg).toContain(">0,01<");
    const adet = (t) => (t.match(/>A</g) || []).length;
    expect(adet(svg)).toBe(adet(render(DEFAULT_PARAMS)) + 2);               // çerçevedeki A + datum kutusundaki A
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("salgı için takımın üstünde yer açılır, takım aşağı iner", () => {
    const bos = duzenHesapla(DEFAULT_PARAMS).yan.oy;
    expect(duzenHesapla({ ...DEFAULT_PARAMS, salgi: "0,01" }).yan.oy).toBeCloseTo(bos + SALGI_UST_EK / 2, 6);
  });
  it("her takım tipinde çökmeden çizilir", () => {
    for (const toolType of ["flat", "ballnose", "bullnose", "chamfer", "drill", "stepdrill", "reamer", "taperreamer", "tslot"]) {
      expect(() => render({ ...DEFAULT_PARAMS, toolType, salgi: "0,01" })).not.toThrow();
    }
  });
  it("sürüklenebilir: kayıtlı konum işaretleri birlikte kaydırır", () => {
    expect(render({ ...DEFAULT_PARAMS, salgi: "0,01" }, { "g-tol": { dx: 4, dy: -2 } })).toContain("translate(4,-2)");
  });
});
