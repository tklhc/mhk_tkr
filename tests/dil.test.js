import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { mt, dilSec, yonMetni, SOZLUKLER } from "../src/drawing/metinler.js";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { FIRMA } from "../src/config.js";

const render = (p) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff: {}, setDimOff: () => {} }));
const ie = { ...DEFAULT_PARAMS, cizimTuru: "ie", chamferSize: 0.3, dpKesme: 8, dpSy1Gen: 1, dpSy1Aci: 8, dpSy2Gen: 2, dpSy2Aci: 16, ekOzellikler: [["Kesme Açısı", "8 °"]] };

describe("resim dili: sözlük", () => {
  it("her Türkçe anahtarın İngilizce karşılığı var, boş değil", () => {
    for (const k of Object.keys(SOZLUKLER.tr)) {
      expect(SOZLUKLER.en[k], k).toBeTruthy();
    }
    expect(Object.keys(SOZLUKLER.en).sort()).toEqual(Object.keys(SOZLUKLER.tr).sort());
  });
  it("bilinmeyen dil Türkçe sayılır; eksik anahtar anahtarın kendisini verir", () => {
    expect(dilSec({ dil: "fr" })).toBe("tr");
    expect(dilSec(undefined)).toBe("tr");
    expect(mt({ dil: "en" }, "alet_adi")).toBe("TOOL NAME");
    expect(mt({}, "yok_boyle_anahtar")).toBe("yok_boyle_anahtar");
  });
  it("{0} yer tutucusu değiştirilir; yön metni dile göre", () => {
    expect(mt({ dil: "en" }, "sigmiyor", "5:1")).toContain("(5:1)");
    expect(yonMetni({ dil: "en" }, "Sol")).toBe("Left");
    expect(yonMetni({}, "Sağ")).toBe("Sağ");
  });
});

describe("resim dili: sayfa", () => {
  it("varsayılan Türkçe: etiketler değişmedi", () => {
    const svg = render(DEFAULT_PARAMS);
    for (const e of ["ALET ADI", "ÇİZİM NO", "TARİH", "MÜŞTERİ", "İE / SİP. NO", "ÇİZEN", "ONAYLAYAN", "TEKNİK VERİ", "Malzeme", "SAYFA", "Ölçek"]) expect(svg).toContain(`>${e}<`);
    expect(svg).toContain("UÇTAN GÖRÜNÜŞ");
  });
  it("İngilizce: antet, tablo, notlar ve görünüş başlıkları çevrilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, dil: "en" });
    for (const e of ["TOOL NAME", "DRAWING NO", "DATE", "CUSTOMER", "ORDER NO", "DRAWN BY", "APPROVED BY", "TECHNICAL DATA", "Material", "Coating", "Flutes", "Helix", "Cutting dir.", "Flute length", "Core", "Coolant", "SHEET", "Scale", "Unit", "Gen. tol."]) expect(svg).toContain(`>${e}<`);
    expect(svg).toContain("END VIEW");
    expect(svg).toContain("35° Right".replace("35", "30"));   // varsayılan helis 30° Sağ → Right
    expect(svg).not.toContain(">ALET ADI<");
    expect(svg).not.toContain("UÇTAN GÖRÜNÜŞ");
  });
  it("İngilizce iş emri çizimi: üretim tablosu başlığı, diş profili ve detay yazıları", () => {
    const svg = render({ ...ie, dil: "en" });
    expect(svg).toContain(">PRODUCTION DATA<");
    expect(svg).toContain("TOOTH PROFILE DETAIL");
    expect(svg).toContain("Rake angle  8°");
    expect(svg).toContain("1st relief  1 mm / 8°");
    expect(svg).toContain("DETAIL A");
    expect(svg).not.toContain("DİŞ PROFİLİ");
    expect(svg).not.toContain("DETAY");
  });
  it("İngilizce çizimde Türkçe sabit yazı kalmaz (kullanıcı verisi ve firma adı hariç)", () => {
    const svg = render({ ...ie, dil: "en", kesitAA: true, cutDir: "Sol", helixHand: "Sol", coolantHole: true, stamp: "ONAYLANDI", genelTolerans: "" });
    const yazilar = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).filter((t) => /[ÇĞİÖŞÜçğıöşü]/.test(t));
    const izinli = new Set([FIRMA.ad, FIRMA.cizen, "Kesme Açısı", "8 °"]);       // marka, kullanıcı adı, iş emrinden gelen özellik
    expect(yazilar.filter((t) => !izinli.has(t))).toEqual([]);
  });
  it("damga dile göre", () => {
    expect(render({ ...DEFAULT_PARAMS, dil: "en", stamp: "TASLAK" })).toContain(">DRAFT<");
    expect(render({ ...DEFAULT_PARAMS, stamp: "TASLAK" })).toContain(">TASLAK<");
  });
});
