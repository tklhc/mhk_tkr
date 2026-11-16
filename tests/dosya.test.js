import { describe, it, expect } from "vitest";
import { kayittanYukle, kismiYukle, kutuphaneKaydi, dosyaMetni, dosyaCoz, guvenliAd } from "../src/io/dosya.js";
import { DEFAULT_PARAMS } from "../src/constants.js";

const kirli = {
  ...DEFAULT_PARAMS, toolName: "ESKI", notes: [{ text: "eski not" }], stamp: "ONAYLANDI", stampDate: "2026-01-01",
  ekOzellikler: [["Kesme Açısı", "8 °"]], cizimTuru: "ie", kagit: "A3", sunum: false, drawingNo: "X-1", customerName: "Eski Müşteri",
};

describe("takım yükleme: önceki resmin kalıntısı kalmaz", () => {
  it("tam kayıt: kayıtta olmayan her alan varsayılana döner", () => {
    const { params, dimOff } = kayittanYukle({ toolName: "YENİ", D: 6, d: 6, L: 50 });
    expect(params).toMatchObject({ toolName: "YENİ", D: 6, notes: [], stamp: "", ekOzellikler: [], cizimTuru: "musteri", drawingNo: "", customerName: "" });
    expect(dimOff).toEqual({});
  });
  it("kayıttaki konumlar yüklenir", () => {
    const r = kayittanYukle({ toolName: "A", dimOff: { "g-uc": { dx: 5, dy: 2 } } });
    expect(r.dimOff).toEqual({ "g-uc": { dx: 5, dy: 2 } });
    expect(r.params.dimOff).toBeUndefined();
  });
  it("kısmi veri (CSV satırı): takım yeni, sayfa tercihleri eski resimden; notlar, damga, üretim özellikleri ve müşteri sıfırlanır", () => {
    const { params, dimOff } = kismiYukle(kirli, { toolName: "CSV-1", D: 8, d: 8, L: 60 });
    expect(params).toMatchObject({ toolName: "CSV-1", D: 8, kagit: "A3", sunum: false, cizimTuru: "ie" });
    expect(params).toMatchObject({ notes: [], stamp: "", stampDate: "", ekOzellikler: [], drawingNo: "", customerName: "" });
    expect(dimOff).toEqual({});
  });
  it("varsayılanlar paylaşılan nesneyi değiştirmez (derin kopya)", () => {
    const { params } = kayittanYukle({ toolName: "A" });
    params.notes.push({ text: "x" });
    params.steps[0].dia = 99;
    expect(DEFAULT_PARAMS.notes).toEqual([]);
    expect(DEFAULT_PARAMS.steps[0].dia).toBe(10);
  });
});

describe("kütüphane kaydı ve dosya", () => {
  it("kütüphane kaydı konumları da saklar", () => {
    const k = kutuphaneKaydi(kirli, { "g-yan": { dx: 1, dy: 2 } }, "AD");
    expect(k.toolName).toBe("AD");
    expect(k.dimOff["g-yan"]).toEqual({ dx: 1, dy: 2 });
    expect(typeof k.savedAt).toBe("string");
  });
  it("dosya kaydet → aç: resim ve konumlar aynen geri gelir", () => {
    const metin = dosyaMetni(kirli, { "g-uc": { dx: -4, dy: 7 } });
    const r = dosyaCoz(metin);
    expect(r.params).toEqual(kirli);
    expect(r.dimOff).toEqual({ "g-uc": { dx: -4, dy: 7 } });
  });
  it("eksik alanlı eski dosya varsayılanlarla tamamlanır", () => {
    const metin = JSON.stringify({ uygulama: "mihenk-teknik-resim", surum: 1, params: { toolName: "ESKI-DOSYA", D: 4 } });
    expect(dosyaCoz(metin).params).toMatchObject({ toolName: "ESKI-DOSYA", D: 4, z: DEFAULT_PARAMS.z, notes: [] });
  });
  it("geçersiz dosyalar anlaşılır hata verir", () => {
    expect(() => dosyaCoz("{bozuk")).toThrow(/JSON/);
    expect(() => dosyaCoz(JSON.stringify({ a: 1 }))).toThrow(/MİHENK/);
    expect(() => dosyaCoz(JSON.stringify({ uygulama: "mihenk-teknik-resim", surum: 99, params: {} }))).toThrow(/güncelleyin/);
  });
  it("dosya adı güvenli", () => {
    expect(guvenliAd('A/B:C*"D"')).toBe("A_B_C_D_");
    expect(guvenliAd("")).toBe("teknik-resim");
  });
});
