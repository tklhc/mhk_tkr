import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { tolSembolVar, SALGI_UST_EK } from "../src/drawing/ToleransSembolleri.jsx";
import { Sayfa, duzenHesapla } from "../src/drawing/Sayfa.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";

const render = (p, dimOff = {}) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff, setDimOff: () => {} }));

describe("salgı ve yüzey işaretleri", () => {
  it("varsayılan resimde yok", () => {
    expect(tolSembolVar(DEFAULT_PARAMS)).toBe(false);
    expect(render(DEFAULT_PARAMS)).not.toContain("Ra ");
  });
  it("boşluklu girdi boş sayılır", () => {
    expect(tolSembolVar({ ...DEFAULT_PARAMS, salgi: "  ", ra: " " })).toBe(false);
  });
  it("salgı girilince çerçeve (değer + A) ve sap üstünde A datumu çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, salgi: "0,01" });
    expect(svg).toContain(">0,01<");
    const adet = (t) => (t.match(/>A</g) || []).length;
    expect(adet(svg)).toBe(adet(render(DEFAULT_PARAMS)) + 2);               // çerçevedeki A + datum kutusundaki A
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("Ra girilince pürüzlülük işareti ve değeri çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, ra: "0,4" });
    expect(svg).toContain(">Ra 0,4<");
    expect((svg.match(/>A</g) || []).length).toBe((render(DEFAULT_PARAMS).match(/>A</g) || []).length);   // salgı yoksa datum da yok
  });
  it("salgı için takımın üstünde yer açılır, takım aşağı iner; Ra için açılmaz", () => {
    const bos = duzenHesapla(DEFAULT_PARAMS).yan.oy;
    expect(duzenHesapla({ ...DEFAULT_PARAMS, salgi: "0,01" }).yan.oy).toBeCloseTo(bos + SALGI_UST_EK / 2, 6);
    expect(duzenHesapla({ ...DEFAULT_PARAMS, ra: "0,4" }).yan.oy).toBe(bos);
  });
  it("her takım tipinde çökmeden çizilir", () => {
    for (const toolType of ["flat", "ballnose", "bullnose", "chamfer", "drill", "stepdrill", "reamer", "taperreamer", "tslot"]) {
      expect(() => render({ ...DEFAULT_PARAMS, toolType, salgi: "0,01", ra: "0,4" })).not.toThrow();
    }
  });
  it("sürüklenebilir: kayıtlı konum işaretleri birlikte kaydırır", () => {
    expect(render({ ...DEFAULT_PARAMS, salgi: "0,01" }, { "g-tol": { dx: 4, dy: -2 } })).toContain("translate(4,-2)");
  });
});
