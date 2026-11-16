import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { disProfiliGeometri, disProfiliHatalari, disProfiliYeterli, disVerisiVar } from "../src/geometry/disProfili.js";
import { takimProfili } from "../src/geometry/profil.js";
import { isEmriMetniCoz, isEmriParametreleri, disProfiliDegerleri } from "../src/io/isEmri.js";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { Sayfa } from "../src/drawing/Sayfa.jsx";

// İE-818: Std. Freze Ø15,5, z=4, çekirdek 8,525; kesme 8°, 1. SY 1,033 mm / 8°, 2. SY 2,067 mm / 16°
const ie818 = { ...DEFAULT_PARAMS, D: 15.5, d: 16, L: 100, l1: 45, z: 4, dCore: 8.525, cizimTuru: "ie", dpKesme: 8, dpSy1Gen: 1.033, dpSy1Aci: 8, dpSy2Gen: 2.067, dpSy2Aci: 16 };
const geo = (p) => disProfiliGeometri(p, takimProfili(p));
const mesafe = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const DEG = Math.PI / 180;

describe("diş profili geometrisi", () => {
  const gm = geo(ie818);
  it("serbest yüzeylerin boyu ve açısı girilen değerlerdir (teğete göre)", () => {
    expect(gm).not.toBeNull();
    expect(mesafe([0, 0], gm.A)).toBeCloseTo(1.033, 6);
    expect(mesafe(gm.A, gm.B)).toBeCloseTo(2.067, 6);
    expect(Math.atan2(gm.A[1], gm.A[0]) / DEG).toBeCloseTo(8, 6);
    expect(Math.atan2(gm.B[1] - gm.A[1], gm.B[0] - gm.A[0]) / DEG).toBeCloseTo(16, 6);
    expect(gm.sigmiyor).toBe(false);
    expect(gm.k).toBe(1);
  });
  it("talaş yüzeyi kesici kenardan γ açısıyla içeri iner ve çekirdek dairesinde biter", () => {
    expect(Math.atan2(gm.Ff[0], gm.Ff[1]) / DEG).toBeCloseTo(8, 6);              // radyalle (v ekseni) 8°
    expect(mesafe(gm.Ff, [0, gm.R])).toBeCloseTo(gm.rc, 6);                       // çekirdek yarıçapı
    expect(mesafe(gm.H, [0, gm.R])).toBeCloseTo(gm.rc, 6);
    expect(mesafe(gm.FfSonraki, [0, gm.R])).toBeCloseTo(gm.rc, 6);
  });
  it("kenar noktaları dış daireden içeridedir (serbest yüzey boşluk açar)", () => {
    for (const q of [gm.A, gm.B]) expect(mesafe(q, [0, gm.R])).toBeLessThan(gm.R);
  });
  it("kanal tabanı yayı ileri gider: topuk, sonraki talaş ayağından önce", () => {
    const psi = (q) => Math.atan2(q[0], gm.R - q[1]);
    expect(psi(gm.H)).toBeLessThan(psi(gm.FfSonraki));
    expect(psi(gm.FfSonraki)).toBeGreaterThan(psi(gm.H));
  });
  it("2. serbest yüzey yoksa yalnız 1. yüzey çizilir", () => {
    const g2 = geo({ ...ie818, dpSy2Gen: 0, dpSy2Aci: 0 });
    expect(g2.ikinci).toBe(false);
    expect(g2.B).toEqual(g2.A);
  });
});

describe("diş profili: veri yetersizse çizilmez (uydurma yok)", () => {
  it("kesme açısı, 1. SY genişliği ya da açısı eksikse geometri yok", () => {
    for (const eksik of ["dpKesme", "dpSy1Gen", "dpSy1Aci"]) expect(geo({ ...ie818, [eksik]: 0 })).toBeNull();
  });
  it("çekirdek çapı yok / dış çapa eşit ya da diş sayısı 1 ise yok", () => {
    expect(geo({ ...ie818, dCore: 0 })).toBeNull();
    expect(geo({ ...ie818, dCore: 15.5 })).toBeNull();
    expect(geo({ ...ie818, z: 1 })).toBeNull();
  });
  it("aşırı açılar reddedilir", () => {
    expect(geo({ ...ie818, dpKesme: 85 })).toBeNull();
    expect(geo({ ...ie818, dpSy1Aci: 70 })).toBeNull();
  });
  it("yeterlilik ve veri var testleri", () => {
    expect(disProfiliYeterli(ie818)).toBe(true);
    expect(disProfiliYeterli({ ...ie818, dpKesme: 0 })).toBe(false);
    expect(disVerisiVar(DEFAULT_PARAMS)).toBe(false);
    expect(disVerisiVar({ ...DEFAULT_PARAMS, dpSy2Gen: 1 })).toBe(true);
  });
});

describe("diş profili: sığmayan genişlikler ve uyarılar", () => {
  it("çok dişli takımda serbest yüzeyler diş aralığına sığmazsa kısaltılır ve uyarı verilir", () => {
    const p = { ...ie818, z: 12, D: 8, d: 8, dCore: 4, dpSy1Gen: 1.5, dpSy2Gen: 2.5 };
    const g = geo(p);
    expect(g.sigmiyor).toBe(true);
    expect(g.k).toBeLessThan(1);
    expect(disProfiliHatalari(p, takimProfili(p)).map((x) => x.mesaj).join("|")).toMatch(/sığmıyor/);
  });
  it("veri hiç girilmediyse uyarı yok; yarım girildiyse neyin eksik olduğu yazılır", () => {
    expect(disProfiliHatalari(DEFAULT_PARAMS, takimProfili(DEFAULT_PARAMS))).toEqual([]);
    const yarim = { ...DEFAULT_PARAMS, dpKesme: 8 };
    expect(disProfiliHatalari(yarim, takimProfili(yarim)).map((x) => x.mesaj).join("|")).toMatch(/1\. serbest yüzey/);
    const iki = { ...ie818, dpSy2Aci: 0 };
    expect(disProfiliHatalari(iki, takimProfili(iki)).map((x) => x.alan)).toContain("dpSy2Aci");
  });
  it("tam ve uyumlu veride uyarı yok", () => {
    expect(disProfiliHatalari(ie818, takimProfili(ie818))).toEqual([]);
  });
});

describe("iş emrinden diş profili değerleri", () => {
  const IE = `TAKIM BİLGİSİ Std. Freze 114x15,5x45x16x100
Takım Çapı 15,5 mm Helis Boyu 45 mm
Şaft Çapı 16 mm Ağız Sayısı 4
Takım Boyu 100 mm
Helis Açısı 35 ° Çekirdek Çapı 8.525 mm
Kesme Açısı 8 ° Kısa Diş Genişliği 4.65 mm
1. Serbest Yüzey Gen. 1.033 mm 1.Alın SY. Açısı 8 °
2.Serb. Yüzey Gen. 2.067 mm 2.Alın SY. Açısı 16 °
Yüzey Açıları 8/16 °`;
  it("etiketlerden beş değer okunur", () => {
    const s = isEmriMetniCoz(IE);
    expect(disProfiliDegerleri(s.ekOzellikler)).toEqual({ dpKesme: 8, dpSy1Gen: 1.033, dpSy1Aci: 8, dpSy2Gen: 2.067, dpSy2Aci: 16 });
  });
  it("içe aktarılan resimde diş profili dolu, yorum uyarısı var; eski değerler taşınmaz", () => {
    const { params, uyarilar } = isEmriParametreleri(isEmriMetniCoz(IE), { ...DEFAULT_PARAMS, dpSy2Gen: 9, dpKesme: 3 });
    expect(params).toMatchObject({ dpKesme: 8, dpSy1Gen: 1.033, dpSy1Aci: 8, dpSy2Gen: 2.067, dpSy2Aci: 16, cizimTuru: "ie" });
    expect(uyarilar.join("|")).toMatch(/Diş profili detayı:.*yorumlandı/);
  });
  it("diş profili etiketleri yoksa hepsi 0 olur ve önceki değer kalmaz", () => {
    const { params, uyarilar } = isEmriParametreleri(isEmriMetniCoz("TAKIM BİLGİSİ Std. Freze\nTakım Çapı 10 mm Şaft Çapı 10 mm Takım Boyu 75 mm"), { ...DEFAULT_PARAMS, dpKesme: 8, dpSy1Gen: 1, dpSy1Aci: 8 });
    expect(params).toMatchObject({ dpKesme: 0, dpSy1Gen: 0, dpSy1Aci: 0, dpSy2Gen: 0, dpSy2Aci: 0 });
    expect(uyarilar.join("|")).not.toMatch(/Diş profili/);
  });
  it("yalnız kesme açısı varsa çizilmediği bildirilir", () => {
    const { uyarilar } = isEmriParametreleri(isEmriMetniCoz("TAKIM BİLGİSİ Std. Freze\nTakım Çapı 10 mm Kesme Açısı 8 °"), DEFAULT_PARAMS);
    expect(uyarilar.join("|")).toMatch(/Diş profili detayı çizilmedi/);
  });
});

describe("diş profili detayı sayfada", () => {
  const render = (p, dimOff = {}) => renderToStaticMarkup(h(Sayfa, { params: p, dimOff, setDimOff: () => {} }));
  it("iş emri çiziminde çizilir: başlık, açılar, genişlikler; çökmez", () => {
    const svg = render(ie818);
    expect(svg).toContain("DİŞ PROFİLİ DETAYI");
    expect(svg).toContain("Kesme açısı  8°");
    expect(svg).toContain("1. SY  1,033 mm / 8°");
    expect(svg).toContain("2. SY  2,067 mm / 16°");
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("müşteri çiziminde ve kapatılınca çizilmez", () => {
    expect(render({ ...ie818, cizimTuru: "musteri" })).not.toContain("DİŞ PROFİLİ");
    expect(render({ ...ie818, disProfili: false })).not.toContain("DİŞ PROFİLİ");
  });
  it("veri yetersizse çizilmez", () => {
    expect(render({ ...ie818, dpKesme: 0 })).not.toContain("DİŞ PROFİLİ");
  });
  it("sol kesimde de çizilir (aynalı), 2. yüzey olmadan da çizilir", () => {
    expect(render({ ...ie818, cutDir: "Sol" })).toContain("DİŞ PROFİLİ DETAYI");
    const svg = render({ ...ie818, dpSy2Gen: 0, dpSy2Aci: 0 });
    expect(svg).toContain("1. SY");
    expect(svg).not.toContain("2. SY");
  });
  it("kayıtlı konum detayı kaydırır", () => {
    expect(render(ie818, { "g-dis": { dx: 6, dy: -3 } })).toContain("translate(6,-3)");
  });
});
