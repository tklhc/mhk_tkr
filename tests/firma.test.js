import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";

// localStorage yerine bellekte çalışan sahte depo (node ortamında yok)
const depo = new Map();
globalThis.localStorage = {
  getItem: (k) => (depo.has(k) ? depo.get(k) : null),
  setItem: (k, v) => { depo.set(k, String(v)); },
  removeItem: (k) => { depo.delete(k); },
};

const { FIRMA, FIRMA_VARSAYILAN, firmaSuz, firmaYukle, firmaKaydet, firmaSifirla, LOGO_AZAMI } = await import("../src/config.js");
const { Sayfa } = await import("../src/drawing/Sayfa.jsx");
const { logoAl, LOGO_IMG } = await import("../src/assets/images.js");
const { DEFAULT_PARAMS } = await import("../src/constants.js");

const render = (p = DEFAULT_PARAMS) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff: {}, setDimOff: () => {} }));
const KUCUK_LOGO = "data:image/png;base64,iVBORw0KGgo=";

beforeEach(() => { depo.clear(); firmaSifirla(); });

describe("firma ayarları", () => {
  it("varsayılanlar MİHENK bilgileridir", () => {
    expect(FIRMA).toEqual(FIRMA_VARSAYILAN);
    expect(FIRMA.ad).toBe("MİHENK KESİCİ TAKIMLAR");
    expect(logoAl()).toBe(LOGO_IMG);
  });
  it("süzgeç: bilinmeyen alan, sayı olmayan değer ve geçersiz logo atılır; metinler kırpılır", () => {
    expect(firmaSuz({ ad: "  X  ", hack: "1", tel: 5, logo: "http://evil/x.png" })).toEqual({ ad: "X" });
    expect(firmaSuz({ logo: KUCUK_LOGO })).toEqual({ logo: KUCUK_LOGO });
    expect(firmaSuz({ logo: `data:image/png;base64,${"A".repeat(LOGO_AZAMI)}` })).toEqual({});
    expect(firmaSuz({ logo: "data:text/html;base64,AAAA" })).toEqual({});
    expect(firmaSuz({ ad: "x".repeat(200) }).ad).toHaveLength(80);
    expect(firmaSuz(null)).toEqual({});
  });
  it("kaydet: bilgiler uygulanır, saklanır; yükleyince geri gelir", () => {
    expect(firmaKaydet({ ad: "ACME TOOLS", tel: "123", logo: KUCUK_LOGO })).toBe(true);
    expect(FIRMA).toMatchObject({ ad: "ACME TOOLS", tel: "123", logo: KUCUK_LOGO });
    expect(logoAl()).toBe(KUCUK_LOGO);
    Object.assign(FIRMA, FIRMA_VARSAYILAN);                        // bellekteki değerleri sil
    firmaYukle();
    expect(FIRMA.ad).toBe("ACME TOOLS");
  });
  it("boş ad ve çizen varsayılana döner", () => {
    firmaKaydet({ ad: "   ", cizen: "" });
    expect(FIRMA.ad).toBe(FIRMA_VARSAYILAN.ad);
    expect(FIRMA.cizen).toBe(FIRMA_VARSAYILAN.cizen);
  });
  it("bozuk saklanan veri varsayılanları bozmaz", () => {
    depo.set("mihenk-firma", "{bozuk");
    expect(() => firmaYukle()).not.toThrow();
    expect(FIRMA.ad).toBe(FIRMA_VARSAYILAN.ad);
  });
  it("sıfırla: varsayılana döner ve saklananı siler", () => {
    firmaKaydet({ ad: "ACME" });
    firmaSifirla();
    expect(FIRMA.ad).toBe(FIRMA_VARSAYILAN.ad);
    expect(depo.has("mihenk-firma")).toBe(false);
  });
});

describe("firma ayarı çizimde", () => {
  it("antette firma adı, çizen ve logo değişir", () => {
    firmaKaydet({ ad: "ACME TOOLS", cizen: "Ayşe Demir", logo: KUCUK_LOGO });
    const svg = render();
    expect(svg).toContain(">ACME TOOLS<");
    expect(svg).toContain(">Ayşe Demir<");
    expect(svg).toContain(KUCUK_LOGO);
    expect(svg).not.toContain("MİHENK KESİCİ");
  });
  it("antette Çizen alanı doluysa firmanın çizeni kullanılmaz", () => {
    firmaKaydet({ cizen: "Ayşe Demir" });
    expect(render({ ...DEFAULT_PARAMS, createdBy: "Ali" })).toContain(">Ali<");
  });
});
