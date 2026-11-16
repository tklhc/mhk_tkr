import { describe, it, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ton, kaplamaRengi, silindirDuraklari } from "../src/drawing/stil.js";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";

const render = (p) => renderToStaticMarkup(h(Sayfa, { params: { ...DEFAULT_PARAMS, ...p }, dimOff: {}, setDimOff: () => {} }));

describe("stil yardımcıları", () => {
  it("ton açar ve koyulaştırır, sınırları aşmaz", () => {
    expect(ton("#808080", 16)).toBe("#909090");
    expect(ton("#808080", -16)).toBe("#707070");
    expect(ton("#fafafa", 50)).toBe("#ffffff");
    expect(ton("#050505", -50)).toBe("#000000");
    expect(ton("bozuk", 0)).toBe("#888888");
  });

  it("kaplama adından renk (Türkçe büyük/küçük harf farkıyla)", () => {
    const altin = kaplamaRengi("ALTIN");           // altın rengi
    const altin2 = kaplamaRengi("AlTiN");          // AlTiN: koyu antrasit — ALTIN'dan farklı
    expect(altin).not.toBe(altin2);
    expect(kaplamaRengi("TiAlN")).toBe("#6d5f80");
    expect(kaplamaRengi("TiN")).toBe("#d2ab3a");
    expect(kaplamaRengi("DLC")).toBe("#383a3f");
    expect(kaplamaRengi("")).toBe("#a9b3bf");      // kaplamasız = çıplak karbür
    expect(kaplamaRengi("-")).toBe("#a9b3bf");
    expect(kaplamaRengi("bilinmeyen X", "#123456")).toBe("#123456");
  });

  it("silindir gradyanı 0–100 arasında artan duraklar verir", () => {
    const d = silindirDuraklari("#808080");
    expect(d[0][0]).toBe(0);
    expect(d[d.length - 1][0]).toBe(100);
    expect(d.map((x) => x[0])).toEqual([...d.map((x) => x[0])].sort((a, b) => a - b));
  });
});

describe("sunum stili ve çerçeve", () => {
  it("sunum açıkken gövde gradyan dolgusu ve gölge var", () => {
    const svg = render({});
    expect(svg).toContain('id="ys-S"');
    expect(svg).toContain('id="ys-K"');
    expect(svg).toContain('id="ys-uc"');
  });
  it("teknik stilde dolgu yok", () => {
    const svg = render({ sunum: false });
    expect(svg).not.toContain("ys-S");
    expect(svg).not.toContain("ys-uc");
  });
  it("kademeli matkapta her kademe kendi gradyanını alır", () => {
    const svg = render({ toolType: "stepdrill", d: 12, L: 90, steps: [{ dia: 10, len: 15, angle: 140 }, { dia: 14, len: 15, angle: 90 }] });
    expect(svg).toContain('id="ys-K0"');
    expect(svg).toContain('id="ys-K1"');
  });
  it("ISO çerçeve: bölge harf/rakamları ve merkezleme çentikleri", () => {
    const svg = render({});
    expect(svg).toContain('id="cerceve"');
    // A4: 6 sütun × 4 satır
    for (const r of [">6<", ">D<"]) expect(svg).toContain(r);
    expect(svg).not.toContain(">7<");
    expect(svg).not.toContain(">E<");
  });
  it("A3 çerçevesinde bölge sayısı artar", () => {
    const svg = render({ kagit: "A3" });
    expect(svg).toContain(">8<");
    expect(svg).toContain(">F<");
  });
  it("hiçbir stilde NaN/undefined yok", () => {
    for (const sunum of [true, false]) expect(render({ sunum })).not.toMatch(/NaN|undefined|Infinity/);
  });
});
