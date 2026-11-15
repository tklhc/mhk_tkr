import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { sonrakiRevizyon, onaylanabilir, onayla, yeniRevizyon, sonSatiriSil, bugunIso } from "../src/io/onay.js";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { revizyonSatirlari } from "../src/drawing/RevizyonTablosu.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { FIRMA } from "../src/config.js";

const render = (p) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff: {}, setDimOff: () => {} }));
const GUN = "2026-11-16";

describe("revizyon harfi", () => {
  it("'' → A → B … Z → AA → AB … AZ → BA", () => {
    expect(sonrakiRevizyon("")).toBe("A");
    expect(sonrakiRevizyon(undefined)).toBe("A");
    expect(sonrakiRevizyon("A")).toBe("B");
    expect(sonrakiRevizyon("Y")).toBe("Z");
    expect(sonrakiRevizyon("Z")).toBe("AA");
    expect(sonrakiRevizyon("AZ")).toBe("BA");
    expect(sonrakiRevizyon("ZZ")).toBe("AAA");
    expect(sonrakiRevizyon(" c ")).toBe("D");
  });
  it("tanınmayan biçim bozulmaz, işaretlenir", () => {
    expect(sonrakiRevizyon("1")).toBe("1+");
  });
  it("bugünün tarihi YYYY-MM-DD", () => {
    expect(bugunIso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("onay akışı", () => {
  it("onaylayan adı yoksa onaylanamaz", () => {
    expect(onaylanabilir({ ...DEFAULT_PARAMS }).var).toBe(false);
    expect(onaylanabilir({ ...DEFAULT_PARAMS, approvedBy: "  " }).neden).toMatch(/Onaylayan adını/);
    expect(() => onayla(DEFAULT_PARAMS, GUN)).toThrow(/Onaylayan/);
  });
  it("onayla: damga, tarih ve geçmiş satırı; girdi değişmez", () => {
    const p = { ...DEFAULT_PARAMS, approvedBy: "Taha", revision: "B" };
    const y = onayla(p, GUN);
    expect(y).toMatchObject({ stamp: "ONAYLANDI", stampDate: GUN });
    expect(y.revizyonlar).toEqual([{ rev: "B", tarih: GUN, aciklama: "Onaylandı", kisi: "Taha" }]);
    expect(p.stamp).toBe(DEFAULT_PARAMS.stamp);
    expect(p.revizyonlar).toEqual([]);
  });
  it("onaylı resim tekrar onaylanmaz", () => {
    const y = onayla({ ...DEFAULT_PARAMS, approvedBy: "Taha" }, GUN);
    expect(onaylanabilir(y).var).toBe(false);
    expect(() => onayla(y, GUN)).toThrow(/Zaten onaylı/);
  });
  it("yeni revizyon: harf ilerler, damga REVİZYON, onay sıfırlanır, açıklama zorunlu", () => {
    const onayli = onayla({ ...DEFAULT_PARAMS, approvedBy: "Taha", createdBy: "Ali" }, GUN);
    const r = yeniRevizyon(onayli, " Kesici boy 25 → 30 ", "2026-12-01");
    expect(r).toMatchObject({ revision: "A", stamp: "REVİZYON", stampDate: "2026-12-01", approvedBy: "" });
    expect(r.revizyonlar.at(-1)).toEqual({ rev: "A", tarih: "2026-12-01", aciklama: "Kesici boy 25 → 30", kisi: "Ali" });
    expect(r.revizyonlar).toHaveLength(2);
    expect(() => yeniRevizyon(onayli, "   ")).toThrow(/açıklaması/);
    expect(onaylanabilir(r).var).toBe(false);                     // yeniden onay için onaylayan adı gerekir
    expect(onayla({ ...r, approvedBy: "Taha" }, "2026-12-02").revizyonlar).toHaveLength(3);
  });
  it("çizen boşsa firmanın varsayılan çizeni yazılır", () => {
    expect(yeniRevizyon(DEFAULT_PARAMS, "x", GUN).revizyonlar[0].kisi).toBe(FIRMA.cizen);
  });
  it("son satırı sil", () => {
    const r = yeniRevizyon(DEFAULT_PARAMS, "x", GUN);
    expect(sonSatiriSil(r).revizyonlar).toEqual([]);
    expect(sonSatiriSil(DEFAULT_PARAMS).revizyonlar).toEqual([]);
  });
});

describe("revizyon tablosu sayfada", () => {
  const gecmis = (n) => Array.from({ length: n }, (_, i) => ({ rev: String.fromCharCode(65 + i), tarih: `2026-0${i + 1}-10`, aciklama: `Değişiklik ${i + 1}`, kisi: "Taha" }));
  it("geçmiş yoksa çizilmez", () => {
    expect(render(DEFAULT_PARAMS)).not.toContain("revizyon-tablosu");
  });
  it("geçmiş varsa başlıklar, en yeni satır ve açıklama çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, revizyonlar: gecmis(2) });
    expect(svg).toContain('id="revizyon-tablosu"');
    expect(svg).toContain(">AÇIKLAMA<");
    expect(svg).toContain(">Değişiklik 2<");
    expect(svg).toContain(">10.02.2026<");
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("en çok 4 satır, en yeni üstte", () => {
    const s = revizyonSatirlari({ revizyonlar: gecmis(6) });
    expect(s.map((x) => x.rev)).toEqual(["F", "E", "D", "C"]);
  });
  it("İngilizce başlıklar", () => {
    const svg = render({ ...DEFAULT_PARAMS, dil: "en", revizyonlar: gecmis(1) });
    expect(svg).toContain(">DESCRIPTION<");
    expect(svg).toContain(">BY<");
  });
  it("sayfa çerçevesinin sağ üstünde, antetle çakışmaz", () => {
    const svg = render({ ...DEFAULT_PARAMS, revizyonlar: gecmis(4) });
    const m = /id="revizyon-tablosu"[^>]*><rect x="([0-9.]+)" y="([0-9.]+)" width="([0-9.]+)" height="([0-9.]+)"/.exec(svg);
    const [x, y, w, hh] = m.slice(1).map(Number);
    expect(x + w).toBeLessThanOrEqual(287);
    expect(y).toBeLessThan(15);
    expect(y + hh).toBeLessThan(148);       // antetin üstü
  });
});
