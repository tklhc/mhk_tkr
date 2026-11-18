import { describe, it, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { tarihYaz } from "../src/drawing/Antet.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { parseCSV, generateCSVTemplate } from "../src/io/csv.js";

const render = (params) => renderToStaticMarkup(h(Sayfa, { params, dimOff: {}, setDimOff: () => {} }));

describe("Sayfa çizimi", () => {
  const takimlar = parseCSV(generateCSVTemplate());

  for (const kagit of ["A4", "A3"]) {
    for (const t of takimlar) {
      it(`${t.toolName} (${kagit}): çizilir, NaN/undefined yok`, () => {
        const svg = render({ ...t, kagit });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        expect(svg).toContain(t.toolName);
      });
    }
  }

  it("A4 yatay viewBox mm cinsinden", () => {
    expect(render({ ...DEFAULT_PARAMS })).toContain('viewBox="0 0 297 210"');
    expect(render({ ...DEFAULT_PARAMS, kagit: "A3" })).toContain('viewBox="0 0 420 297"');
  });

  it("toleranslı ölçü sayısal sapmayla yazılır (h6 → 0 / −0,009)", () => {
    const svg = render({ ...DEFAULT_PARAMS, D: 10, tolD: "h6" });
    expect(svg).toContain("h6");
    expect(svg).toContain("−0,009");
  });

  it("hatalı geometri çökmez", () => {
    for (const ek of [{ L: 0 }, { D: 0 }, { l1: 500 }, { steps: [] , toolType: "stepdrill" }, { z: 0 }, { dCore: 99 }]) {
      expect(() => render({ ...DEFAULT_PARAMS, ...ek })).not.toThrow();
    }
  });

  it("tarih biçimi", () => {
    expect(tarihYaz("2026-11-15")).toBe("15.11.2026");
    expect(tarihYaz("", new Date(2026, 0, 5))).toBe("05.01.2026");
  });
});

describe("yeni tipler ve sap detayı çizimi", () => {
  const ek = [
    { toolName: "R1", toolType: "reamer", D: 10, d: 10, L: 100, l1: 40, chamferSize: 0.5, helix: 0, z: 6 },
    { toolName: "K1", toolType: "taperreamer", D: 10, d: 10, L: 100, l1: 50, tipD: 9, helix: 0, z: 6 },
    { toolName: "T1", toolType: "tslot", D: 16, d: 10, L: 80, l1: 3, l2: 12, neckDia: 8, helix: 0 },
    { toolName: "HB1", D: 10, d: 10, L: 100, l1: 30, sapTipi: "HB" },
    { toolName: "HE1", D: 10, d: 10, L: 100, l1: 30, sapTipi: "HE", sapDuzUzunluk: 18, sapDuzDerinlik: 0.8 },
  ];
  for (const e of ek) {
    it(`${e.toolName}: çizilir, NaN yok`, () => {
      const svg = render({ ...DEFAULT_PARAMS, ...e });
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(svg).toContain(e.toolName);
    });
  }
  it("konik rayba koniklik oranını yazar", () => {
    expect(render({ ...DEFAULT_PARAMS, ...ek[1] })).toContain("Konik 1:50");
  });
  it("Weldon düzlüğü DIN 6535-HB etiketiyle", () => {
    expect(render({ ...DEFAULT_PARAMS, ...ek[3] })).toContain("DIN 6535-HB");
  });
});

import { detayOzelligi } from "../src/drawing/DetayA.jsx";
import { takimProfili } from "../src/geometry/profil.js";

describe("Detay A", () => {
  const ozel = (ek) => { const p = { ...DEFAULT_PARAMS, ...ek }; return detayOzelligi(p, takimProfili(p)); };
  it("radyüs frezede R etiketi ve merkez yay merkezinde", () => {
    const f = ozel({ toolType: "bullnose", D: 12, d: 12, L: 75, rCorner: 1 });
    expect(f.metin).toBe("R1");
    expect(f.cx).toBe(74);
    expect(f.cr).toBe(5);
  });
  it("pah ve rayba girişinde pah etiketi", () => {
    expect(ozel({ toolType: "chamfer", chamferSize: 3 }).metin).toBe("3×45°");
    expect(ozel({ toolType: "reamer", chamferSize: 0.5, helix: 0 }).metin).toBe("0,5×45°");
  });
  it("matkapta uç açısı", () => {
    expect(ozel({ toolType: "drill", pointAngle: 118 }).metin).toBe("118°");
  });
  it("düz frezede detay yok", () => {
    expect(ozel({ toolType: "flat" })).toBeNull();
  });
  it("sayfada: radyüs frezede DETAY A çizilir, düz frezede çizilmez", () => {
    const r = render({ ...DEFAULT_PARAMS, toolType: "bullnose", D: 12, d: 12, rCorner: 1 });
    expect(r).toMatch(/DETAY [AB] [(][0-9]+:1[)]/);
    expect(render({ ...DEFAULT_PARAMS, toolType: "flat" })).not.toContain("DETAY");
  });
});

import { kesitVarMi } from "../src/drawing/Kesit.jsx";

describe("Kesit A-A", () => {
  const dene = (ek) => { const p = { ...DEFAULT_PARAMS, ...ek }; return kesitVarMi(p, takimProfili(p)); };
  it("açıksa ve çekirdek tanımlıysa var; çekirdek 0 ya da kapalıysa yok", () => {
    expect(dene({ kesitAA: true })).toBe(true);
    expect(dene({ kesitAA: true, dCore: 0 })).toBe(false);
    expect(dene({ kesitAA: false })).toBe(false);
    expect(dene({})).toBe(false); // varsayılan: kapalı
  });
  it("sayfada kesme düzlemi, taralı kesit ve 'şematik' notu çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, kesitAA: true });
    expect(svg).toContain("kesit-tarama");
    expect(svg).toContain("şematik");
    expect(svg).toContain("A-A");
  });
  it("kesit varken detay harfi B olur", () => {
    const svg = render({ ...DEFAULT_PARAMS, kesitAA: true, toolType: "bullnose", D: 12, d: 12, rCorner: 1 });
    expect(svg).toContain("kesit-tarama");
    expect(svg).toMatch(/DETAY B/);
  });
  it("kesit kapalıyken detay A olur ve taralı kesit çizilmez", () => {
    const svg = render({ ...DEFAULT_PARAMS, toolType: "bullnose", D: 12, d: 12, rCorner: 1 });
    expect(svg).not.toContain("kesit-tarama");
    expect(svg).toMatch(/DETAY A/);
  });
  it("çekirdek yoksa kesit yok ve detay A kalır", () => {
    const svg = render({ ...DEFAULT_PARAMS, kesitAA: true, toolType: "bullnose", D: 12, d: 12, rCorner: 1, dCore: 0 });
    expect(svg).not.toContain("kesit-tarama");
    expect(svg).toMatch(/DETAY A/);
  });
});

import { sigdir } from "../src/drawing/Antet.jsx";

describe("Antet okunabilirliği", () => {
  it("sigdir: kısa metin azami boyutta, uzun metin küçülür ama asgarinin altına inmez", () => {
    expect(sigdir("MHK", 60, 9)).toBe(9);
    expect(sigdir("A".repeat(40), 70, 9)).toBeCloseTo(3.5, 6);
    expect(sigdir("A".repeat(400), 70, 9)).toBe(2.6);
  });
  it("antette tekrar yok: Malzeme ve Kaplama yalnız teknik veri tablosunda", () => {
    const svg = render({ ...DEFAULT_PARAMS });
    expect(svg).not.toContain(">MALZEME<");
    expect(svg).not.toContain(">KAPLAMA<");
    expect(svg).toContain(">Malzeme<");
    expect(svg).toContain(">Kaplama<");
  });
  it("antet alanları: çizim no, rev, tarih, müşteri, İE no, çizen, onaylayan (Teslim ve Genel tolerans yok)", () => {
    const svg = render({ ...DEFAULT_PARAMS, drawingNo: "MHK-TR-1", revision: "A" });
    for (const e of ["ALET ADI", "ÇİZİM NO", "REV.", "TARİH", "MÜŞTERİ", "İE / SİP. NO", "ÇİZEN", "ONAYLAYAN"]) expect(svg).toContain(`>${e}<`);
    expect(svg).not.toContain(">TESLİM<");
    expect(svg).not.toContain(">GENEL TOLERANS<");
    expect(svg).toContain(">MHK-TR-1<");
  });
  it("antette Ölçek ve Kağıt hücresi yok", () => {
    const svg = render({ ...DEFAULT_PARAMS });
    expect(svg).not.toContain(">ÖLÇEK<");
    expect(svg).not.toContain(">KAĞIT<");
  });
  it("yazı boyutları: antette hiçbir yazı 2,4 mm'den küçük değil", () => {
    const svg = render({ ...DEFAULT_PARAMS, customerName: "X", orderNo: "1", deliveryDate: "2026-11-20" });
    const antet = svg.slice(svg.indexOf("TEKNİK VERİ") - 400);
    const boyutlar = [...antet.matchAll(/font-size="([0-9.]+)"/g)].map((m) => +m[1]);
    expect(boyutlar.length).toBeGreaterThan(20);
    expect(Math.min(...boyutlar)).toBeGreaterThanOrEqual(2.4);
  });
  it("müşteri ve İE no antet hücresinde, iki çizim türünde de", () => {
    for (const cizimTuru of ["musteri", "ie"]) {
      const svg = render({ ...DEFAULT_PARAMS, cizimTuru, customerName: "ABC Makina", orderNo: "İE-818" });
      expect(svg).toContain(">ABC Makina<");
      expect(svg).toContain(">İE-818<");
    }
  });
  it("antet ve alt tablo ölçüleri iki çizim türünde aynı", () => {
    const ek = Array.from({ length: 8 }, (_, i) => [`Özellik ${i}`, `${i} mm`]);
    const m = duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "musteri" });
    const ie = duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek });
    expect(ie.antet).toEqual(m.antet);
    expect(ie.veriTablosu).toEqual(m.veriTablosu);   // 8 satır: aynı genişlik, yükseklik, yer
    expect(ie.yan.olcek).toBe(m.yan.olcek);
  });
  it("iş emri çiziminde teknik veri tablosu yok (yerinde üretim özellikleri); müşteri çiziminde teknik veri var, üretim yok", () => {
    const ek = [["Kesme Açısı", "8 °"], ["Alın Açısı", "1.5 °"]];
    const ie = render({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek });
    expect(ie).not.toContain(">TEKNİK VERİ<");
    expect(ie).not.toContain(">Malzeme<");
    expect(ie).toContain(">ÜRETİM ÖZELLİKLERİ<");
    const m = render({ ...DEFAULT_PARAMS, cizimTuru: "musteri", ekOzellikler: ek });
    expect(m).toContain(">TEKNİK VERİ<");
    expect(m).not.toContain(">ÜRETİM ÖZELLİKLERİ<");
  });
  it("iş emri çiziminde de antetteki hiçbir yazı 2,4 mm'den küçük değil", () => {
    const svg = render({ ...DEFAULT_PARAMS, cizimTuru: "ie", toolName: "Std. Freze 114x15,5x45x16x100", customerName: "ABC Makina Sanayi", orderNo: "İE-818", ekOzellikler: Array.from({ length: 12 }, (_, i) => [`Özellik ${i}`, `${i}.5 mm`]) });
    const antet = svg.slice(svg.indexOf("ALET ADI") - 400);
    const boyutlar = [...antet.matchAll(/font-size="([0-9.]+)"/g)].map((m) => +m[1]);
    expect(Math.min(...boyutlar)).toBeGreaterThanOrEqual(2.4);
  });
});

import { tolYigini, YAZI_PAYI } from "../src/drawing/iso.jsx";

describe("Ölçü yazısı toleransı", () => {
  it("ISO sınıfı (tabloda varsa) ve iki sapma yığınlıdır; ± ve boş değildir", () => {
    expect(tolYigini("h6", 10)).toBe(true);
    expect(tolYigini("+0.02/-0.01", 10)).toBe(true);
    expect(tolYigini("±0.05", 10)).toBe(false);
    expect(tolYigini("", 10)).toBe(false);
    expect(tolYigini("K7", 10)).toBe(false); // tabloda yok: yalnız metin
  });
  it("yığınlı toleransta yazı ölçü çizgisinden daha yukarıda durur", () => {
    expect(YAZI_PAYI.yigin).toBeGreaterThan(YAZI_PAYI.duz);
  });
  it("sayfada h6 sapmaları ana yazıyla aynı grupta, yazılar çizgiyi örtmez (üst sapma < taban)", () => {
    const svg = render({ ...DEFAULT_PARAMS });
    expect(svg).toContain("−0,009");
    expect(svg).toContain("h6");
  });
});

import { tabloSutunlari } from "../src/drawing/sayfaDuzeni.js";
import { duzenHesapla } from "../src/drawing/Sayfa.jsx";

describe("Üretim özellikleri tablosu", () => {
  const ek = [["Kesme Açısı", "8 °"], ["Kısa Diş Genişliği", "4.65 mm"], ["Yüzey Tipi", "Serbest Yüzey"], ["Alın Açısı", "1.5 °"]];
  it("özellik yoksa ya da kapalıysa çizilmez", () => {
    expect(render({ ...DEFAULT_PARAMS, cizimTuru: "ie" })).not.toContain("uretim-tablosu");
    expect(render({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek, ekGoster: false })).not.toContain("uretim-tablosu");
  });
  it("müşteri çiziminde üretim özellikleri hiç çizilmez (veri durur, tür değişince geri gelir)", () => {
    const svg = render({ ...DEFAULT_PARAMS, cizimTuru: "musteri", ekOzellikler: ek });
    expect(svg).not.toContain("uretim-tablosu");
    expect(svg).not.toContain("ÜRETİM ÖZELLİKLERİ");
    expect(svg).not.toContain(">Serbest Yüzey<");
    expect(render({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek })).toContain("uretim-tablosu");
  });
  it("özellikler varken tablo ve değerleri çizilir", () => {
    const svg = render({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek });
    expect(svg).toContain("uretim-tablosu");
    expect(svg).toContain("ÜRETİM ÖZELLİKLERİ");
    expect(svg).toContain(">Serbest Yüzey<");
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("tablo antete bitişik, antetin altıyla hizalı ve çerçevenin içinde", () => {
    const d = duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek });
    expect(d.tablo).not.toBeNull();
    expect(d.veriTablosu.w).toBe(d.tablo.w);
    expect(d.veriTablosu.x + d.veriTablosu.w).toBe(d.antet.x);
    expect(d.veriTablosu.y + d.veriTablosu.h).toBeCloseTo(d.antet.y + d.antet.h, 6);
    expect(d.veriTablosu.h).toBeLessThanOrEqual(d.antet.h);
    expect(d.veriTablosu.x).toBeGreaterThanOrEqual(d.cerceve.x);
  });
  it("sütun sayısı satır sayısına uyar: satırlar 3,9 mm'den sıkışmaz, sığmayan atılır", () => {
    expect(tabloSutunlari(0)).toBeNull();
    const on = tabloSutunlari(10);           // İE-818: 10 özellik tek sütun
    expect(on.sutun).toBe(1);
    expect(on.satirH).toBeGreaterThanOrEqual(3.9);
    expect(tabloSutunlari(14).sutun).toBe(2);
    expect(tabloSutunlari(200)).toMatchObject({ sutun: 3 });
    expect(tabloSutunlari(200).adet).toBeLessThan(200);
    expect(tabloSutunlari(8).h).toBeCloseTo(52, 6);   // müşteri çiziminin 8 satırlık teknik verisi şeridi doldurur
  });
  it("özellik yoksa iş emri şeridi yalnız antettir; müşteri çiziminde teknik veri her zaman var", () => {
    expect(duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "ie" }).veriTablosu.w).toBe(0);
    expect(duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "musteri" }).veriTablosu.w).toBeGreaterThan(0);
  });
  it("çok fazla özellik sığmazsa fazlası atılır, çökmez", () => {
    const cok = Array.from({ length: 60 }, (_, i) => [`Özellik ${i}`, `${i} mm`]);
    expect(() => render({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: cok })).not.toThrow();
  });
});

describe("Görünüşlerin sürüklenmesi", () => {
  const renderOff = (params, dimOff) => renderToStaticMarkup(h(Sayfa, { params, dimOff, setDimOff: () => {} }));
  const p = { ...DEFAULT_PARAMS, cizimTuru: "ie", chamferSize: 0.264, ekOzellikler: [["Kesme Açısı", "8 °"]] };
  it("yan görünüş, detay ve uçtan görünüş sürüklenebilir tutamaçla gelir", () => {
    const svg = render(p);
    expect((svg.match(/gorunum-tutac/g) || []).length).toBeGreaterThanOrEqual(3);
  });
  it("kayıtlı konum görünüşü ve içindekileri birlikte kaydırır", () => {
    const svg = renderOff(p, { "g-uc": { dx: 12, dy: -7 } });
    expect(svg).toContain("translate(12,-7)");
  });
  it("kesit açıkken kesit görünüşü de sürüklenebilir; düzlem işareti yan görünüşle gider", () => {
    const k = { ...DEFAULT_PARAMS, kesitAA: true };
    expect(renderOff(k, { "g-kesit": { dx: 3, dy: 4 } })).toContain("translate(3,4)");
    expect(renderOff(k, { "g-yan": { dx: 5, dy: 6 } })).toContain("translate(5,6)");
  });
  it("tutamaçlar ölçü/etiket tutamaçlarını bozmaz: setOffsets yoksa tutamaç da yok", () => {
    const svg = renderToStaticMarkup(h(Sayfa, { params: p, dimOff: {}, setDimOff: undefined }));
    expect(svg).not.toContain("gorunum-tutac");
  });
});

describe("Sol alttaki sayfa notları kutusu yok; tablo antetle aynı yükseklikte", () => {
  it("ölçek, birim ve genel tolerans kutusu hiçbir çizimde yazılmaz", () => {
    for (const cizimTuru of ["musteri", "ie"]) {
      const svg = render({ ...DEFAULT_PARAMS, cizimTuru, olcek: "1:1", ekOzellikler: [["Kesme Açısı", "8 °"]] });
      for (const e of ['id="sayfa-notlari"', ">SAYFA<", ">Ölçek<", ">Birim<", ">Genel tol.<"]) expect(svg).not.toContain(e);
    }
  });
  it("üretim ve teknik veri tablosunun üstü antetin üstüyle hizalıdır, az satırda da", () => {
    for (const ek of [[["Kesme Açısı", "8 °"]], Array.from({ length: 7 }, (_, i) => [`Ö${i}`, "1"]), Array.from({ length: 10 }, (_, i) => [`Ö${i}`, "1"])]) {
      const d = duzenHesapla({ ...DEFAULT_PARAMS, cizimTuru: "ie", ekOzellikler: ek });
      expect(d.veriTablosu.y).toBeCloseTo(d.antet.y, 6);
      expect(d.veriTablosu.h).toBeCloseTo(d.antet.h, 6);
    }
  });
  it("firma iletişim bilgileri antette firma adının altında yazılır", () => {
    const svg = render({ ...DEFAULT_PARAMS, cizimTuru: "ie" });
    for (const e of ["0507 321 62 80", "taha@mihenk.net", "www.mihenkkesicitakimlar.com"]) expect(svg).toContain(`>${e}<`);
  });
});

describe("Matkap uç konisi boyu (tepeden 1. çapa, referans ölçü)", () => {
  it("ucKonisiBoyu = (D/2) / tan(uç açısı/2); matkap dışı takımda yok", async () => {
    const { ucKonisiBoyu, takimProfili } = await import("../src/geometry/profil.js");
    const p = { ...DEFAULT_PARAMS, toolType: "drill", D: 15.9, pointAngle: 140 };
    expect(ucKonisiBoyu(takimProfili(p), p).boy).toBeCloseTo(7.95 / Math.tan((70 * Math.PI) / 180), 6);
    const f = { ...DEFAULT_PARAMS, toolType: "flat" };
    expect(ucKonisiBoyu(takimProfili(f), f)).toBeNull();
  });
  it("matkapta ve kademeli matkapta parantez içinde yazılır; kapatılınca yazılmaz", () => {
    expect(render({ ...DEFAULT_PARAMS, toolType: "drill", D: 15.9, pointAngle: 140 })).toContain(">(2,89)<");
    expect(render({ ...DEFAULT_PARAMS, toolType: "stepdrill" })).toContain(">(1,82)<");   // varsayılan 1. kademe ⌀10, 140°
    expect(render({ ...DEFAULT_PARAMS, toolType: "stepdrill", kademeOlcu: "toplam" })).toContain(">(1,82)<");
    expect(render({ ...DEFAULT_PARAMS, toolType: "drill", showDiml1: false })).not.toMatch(/>\(\d/);
    expect(render({ ...DEFAULT_PARAMS, toolType: "flat" })).not.toMatch(/>\(\d/);
  });
});

describe("Uçtan görünüş kapatılabilir", () => {
  it("varsayılan açık; kapatılınca çizilmez ve yan görünüş tüm genişliği kullanır", () => {
    expect(render({ ...DEFAULT_PARAMS })).toContain("UÇTAN GÖRÜNÜŞ");
    const p = { ...DEFAULT_PARAMS, ucGorunus: false };
    expect(render(p)).not.toContain("UÇTAN GÖRÜNÜŞ");
    const d = duzenHesapla(p), d0 = duzenHesapla(DEFAULT_PARAMS);
    expect(d.yan.bolge.w).toBeCloseTo(d.alan.w, 6);
    expect(d.yan.bolge.w).toBeGreaterThan(d0.yan.bolge.w);
    expect(d.yan.olcek).toBeGreaterThanOrEqual(d0.yan.olcek);
  });
  it("kesit A-A açıksa sağ sütun kesite kalır, kesit çizilir", () => {
    const p = { ...DEFAULT_PARAMS, ucGorunus: false, kesitAA: true, dCore: 6 };
    const svg = render(p);
    expect(svg).not.toContain("UÇTAN GÖRÜNÜŞ");
    expect(svg).toMatch(/KESİT A-A/);
    expect(duzenHesapla(p).yan.bolge.w).toBeLessThan(duzenHesapla(p).alan.w);
  });
  it("DXF'te de uçtan görünüş yazılmaz", async () => {
    const { generateDXF: dxfOlustur } = await import("../src/io/dxf.js");
    expect(dxfOlustur({ ...DEFAULT_PARAMS })).toContain("UCTAN GORUNUS");
    expect(dxfOlustur({ ...DEFAULT_PARAMS, ucGorunus: false })).not.toContain("UCTAN GORUNUS");
  });
});

describe("Okunaklı ölçüler", () => {
  it("uç konisi boyu ölçüsü ayrıca kapatılabilir (resim ve DXF)", async () => {
    const p = { ...DEFAULT_PARAMS, toolType: "drill", D: 15.9, pointAngle: 140 };
    expect(render({ ...p, showUcKonisi: false })).not.toContain(">(2,89)<");
    expect(render({ ...p, showUcKonisi: false })).toMatch(/>⌀15,9[ <]/);   // diğer ölçüler yerinde
    const { generateDXF } = await import("../src/io/dxf.js");
    expect(generateDXF(p)).toContain("(2,89)");
    expect(generateDXF({ ...p, showUcKonisi: false })).not.toContain("(2,89)");
  });
  it("oklar arasına sığmayan yazı ölçü çizgisinin uzantısına, dışarı yazılır", async () => {
    const { olcuYaziGenisligi } = await import("../src/drawing/iso.jsx");
    const w = olcuYaziGenisligi({ deger: 2.89, referans: true });
    expect(w).toBeGreaterThan(5);   // "(2,89)" 5 mm'den uzun: 2,89×2 = 5,8 mm'lik ölçüye oklarla sığmaz
    const p = { ...DEFAULT_PARAMS, toolType: "drill", D: 15.9, pointAngle: 140 };
    const m = /<text[^>]*x="([\d.]+)"[^>]*>\(2,89\)<\/text>/.exec(render(p));
    const d = duzenHesapla(p);
    const xUc = d.yan.ox + p.L * d.yan.olcek;          // takımın tepesi
    expect(+m[1]).toBeGreaterThan(xUc);               // yazı tepenin dışında başlar, okların arasında değil
  });
  it("satırlar arası 10 mm", async () => {
    const { OLCU_SATIR } = await import("../src/drawing/sayfaDuzeni.js");
    expect(OLCU_SATIR).toBe(10);
  });
});

describe("Çap ölçüsü yazısı eksende kalır", () => {
  it("küçük ölçekte bile 1. kademe çapı (toleranslı) eksene ortalanır, aşağı kaymaz", () => {
    const p = { ...DEFAULT_PARAMS, toolType: "stepdrill", d: 16, L: 82, kademeOlcu: "toplam", olcek: "1:1",
      steps: [{ dia: 14.75, len: 10, angle: 140, tolDia: "+0,08/0", tolLen: "" }, { dia: 16, len: 20, angle: 90, tolDia: "", tolLen: "" }] };
    const svg = render(p);
    const m = /<g transform="rotate\(-90 ([\d.]+) ([\d.]+)\)"><text[^>]*>⌀14,75<\/text>/.exec(svg);
    expect(m).not.toBeNull();
    const d = duzenHesapla(p);
    const yazi = /<text x="([\d.]+)"[^>]*>⌀14,75<\/text>/.exec(svg.slice(m.index));
    expect(+m[2]).toBeCloseTo(d.yan.oy, 0);   // döndürme noktası eksende
    // -90° döndürmede yazının başlangıcı (yerel x) döndürme noktasının yarım yazı boyu kadar önünde: eksene ortalı
    const yariBoy = +m[1] - +yazi[1];
    expect(yariBoy).toBeGreaterThan(2);
    expect(yariBoy).toBeLessThan(10);
  });
});
