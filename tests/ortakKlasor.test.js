import { describe, it, expect } from "vitest";
import { listele, oku, varMi, yaz, dosyaAdiOlustur, destekleniyor, UZANTI } from "../src/io/ortakKlasor.js";
import { dosyaMetni } from "../src/io/dosya.js";
import { DEFAULT_PARAMS } from "../src/constants.js";

// File System Access API'sinin bellekteki sahtesi
class SahteDosya {
  constructor(ad, metin = "") { this.kind = "file"; this.name = ad; this.metin = metin; }
  async getFile() { const m = this.metin; return { text: async () => m }; }
  async createWritable() { const o = this; return { buf: "", async write(m) { this.buf += m; }, async close() { o.metin = this.buf; } }; }
}
class SahteKlasor {
  constructor() { this.dosyalar = new Map(); this.kind = "directory"; }
  ekle(ad, metin) { this.dosyalar.set(ad, new SahteDosya(ad, metin)); return this; }
  async *entries() { for (const [ad, h] of this.dosyalar) yield [ad, h]; yield ["alt-klasor", { kind: "directory" }]; }
  async getFileHandle(ad, { create } = {}) {
    if (!this.dosyalar.has(ad)) {
      if (!create) { const e = new Error("yok"); e.name = "NotFoundError"; throw e; }
      this.dosyalar.set(ad, new SahteDosya(ad));
    }
    return this.dosyalar.get(ad);
  }
}

const takim = (ad, ek = {}) => ({ ...DEFAULT_PARAMS, toolName: ad, ...ek });

describe("ortak klasör", () => {
  it("dosya adı güvenli ve uzantılı", () => {
    expect(dosyaAdiOlustur("MHK-E10x75")).toBe(`MHK-E10x75${UZANTI}`);
    expect(dosyaAdiOlustur('A/B:C*"D"')).toBe(`A_B_C_D_${UZANTI}`);
    expect(dosyaAdiOlustur("")).toBe(`isimsiz${UZANTI}`);
    expect(dosyaAdiOlustur(undefined)).toBe(`isimsiz${UZANTI}`);
  });
  it("destek denetimi tarayıcı dışında yok der, çökmez", () => {
    expect(destekleniyor()).toBe(false);
  });
  it("listele: yalnız .mhk.json dosyaları, ada göre sıralı; alt klasör ve başka dosya yok", async () => {
    const k = new SahteKlasor().ekle("b.mhk.json", "{}").ekle("a.MHK.JSON", "{}").ekle("not.txt", "x").ekle("c.json", "{}");
    expect((await listele(k)).map((x) => x.ad)).toEqual(["a.MHK.JSON", "b.mhk.json"]);
  });
  it("yaz → oku: resim ve konumlar aynen döner", async () => {
    const k = new SahteKlasor();
    const ad = await yaz(k, takim("MHK-1", { D: 12, d: 12, L: 80, notes: [{ text: "n" }] }), { "g-uc": { dx: 3, dy: 1 } });
    expect(ad).toBe(`MHK-1${UZANTI}`);
    const r = await oku((await listele(k))[0].tutamac);
    expect(r.params).toMatchObject({ toolName: "MHK-1", D: 12, L: 80, notes: [{ text: "n" }] });
    expect(r.dimOff).toEqual({ "g-uc": { dx: 3, dy: 1 } });
  });
  it("aynı adlı takım yazılınca değiştirilir (yinelenen dosya oluşmaz)", async () => {
    const k = new SahteKlasor();
    await yaz(k, takim("X", { L: 60 }), {});
    await yaz(k, takim("X", { L: 90 }), {});
    const l = await listele(k);
    expect(l).toHaveLength(1);
    expect((await oku(l[0].tutamac)).params.L).toBe(90);
  });
  it("varMi: var olan true, olmayan false; başka hata yukarı fırlar", async () => {
    const k = new SahteKlasor().ekle("var.mhk.json", "{}");
    expect(await varMi(k, "var.mhk.json")).toBe(true);
    expect(await varMi(k, "yok.mhk.json")).toBe(false);
    const bozuk = { getFileHandle: async () => { const e = new Error("izin"); e.name = "NotAllowedError"; throw e; } };
    await expect(varMi(bozuk, "x")).rejects.toThrow("izin");
  });
  it("bozuk ya da yabancı dosya anlaşılır hata verir", async () => {
    const k = new SahteKlasor().ekle("bozuk.mhk.json", "{kırık").ekle("yabanci.mhk.json", JSON.stringify({ a: 1 }));
    const [bozuk, yabanci] = await listele(k);
    await expect(oku(bozuk.tutamac)).rejects.toThrow(/JSON/);
    await expect(oku(yabanci.tutamac)).rejects.toThrow(/MİHENK/);
  });
  it("uygulamanın kaydettiği dosya klasörden okunabilir (aynı biçim)", async () => {
    const k = new SahteKlasor().ekle("a.mhk.json", dosyaMetni(takim("A"), {}));
    expect((await oku((await listele(k))[0].tutamac)).params.toolName).toBe("A");
  });
});
