import { describe, it, expect } from "vitest";
import { isoSapma, itDegeri, toleransCoz, sapmaYaz } from "../src/geometry/tolerans.js";

describe("ISO 286 tabloları", () => {
  it("IT değerleri aralık sınırında doğru aralığı seçer (üst sınır dahil)", () => {
    expect(itDegeri(10, 6)).toBe(9);   // 6–10
    expect(itDegeri(10.01, 6)).toBe(11); // 10–18
    expect(itDegeri(3, 7)).toBe(10);
    expect(itDegeri(501, 7)).toBeNull();
  });

  // Değerler ISO 286-2 tablolarından
  const ornekler = [
    [10, "h6", 0, -0.009],
    [6, "h5", 0, -0.005],
    [12, "h6", 0, -0.011],
    [20, "h7", 0, -0.021],
    [8, "h9", 0, -0.036],
    [10, "e8", -0.025, -0.047],
    [16, "f7", -0.016, -0.034],
    [25, "g6", -0.007, -0.020],
    [10, "k6", 0.010, 0.001],
    [10, "k8", 0.022, 0],
    [10, "m7", 0.021, 0.006],
    [30, "n6", 0.028, 0.015],
    [10, "p6", 0.024, 0.015],
    [10, "H7", 0.015, 0],
    [10, "G6", 0.014, 0.005],
    [10, "F7", 0.028, 0.013],
    [10, "js6", 0.0045, -0.0045],
    [10, "js7", 0.007, -0.007], // IT7 = 15 → tek sayı, ±7
    [10, "JS8", 0.011, -0.011],
  ];
  for (const [anma, sinif, ust, alt] of ornekler) {
    it(`⌀${anma} ${sinif} → ${ust} / ${alt}`, () => {
      const s = isoSapma(anma, sinif);
      expect(s.ust).toBeCloseTo(ust, 6);
      expect(s.alt).toBeCloseTo(alt, 6);
    });
  }

  it("desteklenmeyen sınıflar null", () => {
    expect(isoSapma(10, "K7")).toBeNull();
    expect(isoSapma(10, "z6")).toBeNull();
    expect(isoSapma(600, "h6")).toBeNull();
  });
});

describe("toleransCoz", () => {
  it("ISO sınıfı", () => expect(toleransCoz("h6", 10)).toEqual({ tur: "iso", sinif: "h6", ust: 0, alt: -0.009 }));
  it("tabloda olmayan ISO sınıfı metin olarak kalır", () => expect(toleransCoz("K7", 10)).toEqual({ tur: "iso", sinif: "K7", ust: null, alt: null }));
  it("simetrik, virgüllü", () => expect(toleransCoz("±0,05", 10)).toEqual({ tur: "simetrik", ust: 0.05, alt: -0.05 }));
  it("+- yazımı", () => expect(toleransCoz("+-0.1", 10)).toEqual({ tur: "simetrik", ust: 0.1, alt: -0.1 }));
  it("iki sapma, sıra fark etmez", () => {
    expect(toleransCoz("+0.02/-0.01", 10)).toEqual({ tur: "sapma", ust: 0.02, alt: -0.01 });
    expect(toleransCoz("-0.03 / -0.01", 10)).toEqual({ tur: "sapma", ust: -0.01, alt: -0.03 });
    expect(toleransCoz("0/-0.009", 10)).toEqual({ tur: "sapma", ust: 0, alt: -0.009 });
  });
  it("boş ve anlamsız", () => {
    expect(toleransCoz("", 10)).toBeNull();
    expect(toleransCoz("hassas", 10)).toBeNull();
  });
});

describe("sapmaYaz", () => {
  it("işaret ve virgül", () => {
    expect(sapmaYaz(0)).toBe("0");
    expect(sapmaYaz(-0.009)).toBe("−0,009");
    expect(sapmaYaz(0.0045)).toBe("+0,0045");
    expect(sapmaYaz(0.1)).toBe("+0,1");
  });
});
