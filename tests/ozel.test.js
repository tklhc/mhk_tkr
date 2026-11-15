import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { takimProfili, tamKontur, parcaUclari } from "../src/geometry/profil.js";
import { tipDegistir } from "../src/geometry/tipler.js";
import { generateDXF } from "../src/io/dxf.js";
import { Sayfa } from "../src/drawing/Sayfa.jsx";
import { DEFAULT_PARAMS } from "../src/constants.js";

const ozel = (noktalar, ek = {}) => ({ ...DEFAULT_PARAMS, toolType: "custom", profilNoktalari: noktalar, ...ek });
const mesajlar = (g) => g.hatalar.map((x) => x.mesaj).join(" | ");

describe("özel takım: serbest profil", () => {
  const nk = [{ x: 0, dia: 10 }, { x: 40, dia: 10 }, { x: 43, dia: 8 }, { x: 70, dia: 8 }, { x: 75, dia: 0 }];
  const g = takimProfili(ozel(nk));

  it("D, d ve L noktalardan türetilir", () => {
    expect(g.tip).toBe("custom");
    expect(g.D).toBe(10);       // en büyük çap (sap)
    expect(g.d).toBe(10);
    expect(g.L).toBe(75);
    expect(g.hatalar).toEqual([]);
  });

  it("kontur noktalardan geçer ve kapalıdır; çapı 0 olan uç sivridir (dik alın yok)", () => {
    const parcalar = g.ust;
    expect(parcaUclari(parcalar[0])).toMatchObject({ x1: 0, y1: 0, x2: 0, y2: 5 });
    expect(parcaUclari(parcalar[parcalar.length - 1])).toMatchObject({ x2: 75, y2: 0 });
    expect(parcalar.some((s) => s.x1 === 75 && s.x2 === 75)).toBe(false);
    const k = tamKontur(g);
    const uc = (s) => parcaUclari(s);
    for (let i = 1; i < k.length; i++) {
      const a = uc(k[i - 1]), b = uc(k[i]);
      expect(Math.hypot(a.x2 - b.x1, a.y2 - b.y1)).toBeLessThan(1e-6);
    }
  });

  it("son nokta çaplıysa uç dik alınla eksene iner", () => {
    const g2 = takimProfili(ozel([{ x: 0, dia: 10 }, { x: 50, dia: 6 }]));
    expect(parcaUclari(g2.ust[g2.ust.length - 1])).toMatchObject({ x1: 50, y1: 3, x2: 50, y2: 0 });
  });

  it("eğim ya da çap değişen iç köşelerde görünür kenar çizgisi olur", () => {
    expect(g.kenarlar.map((k) => [k.x, k.r])).toEqual([[40, 5], [43, 4], [70, 4]]);
  });

  it("aynı x'te iki nokta dikey basamaktır", () => {
    const b = takimProfili(ozel([{ x: 0, dia: 10 }, { x: 30, dia: 10 }, { x: 30, dia: 6 }, { x: 60, dia: 6 }]));
    expect(b.hatalar).toEqual([]);
    expect(b.ust.some((s) => s.x1 === 30 && s.x2 === 30 && s.y1 === 5 && s.y2 === 3)).toBe(true);
  });

  describe("kesici (kanallı) bölüm başlangıcı", () => {
    it("sap + daha ince/kalın kesici: kesici en büyük çapa ulaşılan yerden başlar", () => {
      const k = takimProfili(ozel([{ x: 0, dia: 6 }, { x: 40, dia: 6 }, { x: 45, dia: 10 }, { x: 70, dia: 10 }, { x: 72, dia: 8 }]));
      expect(k.x.sapSonu).toBe(40);
      expect(k.x.boyunSonu).toBe(45);
      expect(k.l1).toBe(27);
    });
    it("tamamen silindirik (yalnız uç pahı) takım: boyun %40'ı", () => {
      const s = takimProfili(ozel([{ x: 0, dia: 10 }, { x: 74, dia: 10 }, { x: 75, dia: 8 }]));
      expect(s.x.boyunSonu).toBeCloseTo(45, 6);
      expect(s.hatalar).toEqual([]);
    });
    it("elle verilen başlangıç otomatiğin yerine geçer; sınır dışı uyarı verir", () => {
      expect(takimProfili(ozel(nk, { ozelKesiciBas: 50 })).x.boyunSonu).toBe(50);
      expect(mesajlar(takimProfili(ozel(nk, { ozelKesiciBas: 80 })))).toMatch(/Kesici bölüm başlangıcı/);
    });
  });

  describe("doğrulama", () => {
    it("tek nokta ya da boş liste", () => {
      expect(mesajlar(takimProfili(ozel([])))).toMatch(/en az iki nokta/);
      expect(mesajlar(takimProfili(ozel([{ x: 0, dia: 5 }])))).toMatch(/en az iki nokta/);
    });
    it("ilk nokta x=0 olmalı", () => {
      expect(mesajlar(takimProfili(ozel([{ x: 3, dia: 5 }, { x: 40, dia: 5 }])))).toMatch(/x = 0/);
    });
    it("x geriye giderse açıklayıcı uyarı", () => {
      expect(mesajlar(takimProfili(ozel([{ x: 0, dia: 5 }, { x: 40, dia: 5 }, { x: 30, dia: 4 }])))).toMatch(/3\. noktanın x/);
    });
    it("orta noktada çap 0 ve negatif çap reddedilir; aynı nokta tekrarı bildirilir", () => {
      expect(mesajlar(takimProfili(ozel([{ x: 0, dia: 5 }, { x: 20, dia: 0 }, { x: 40, dia: 5 }])))).toMatch(/yalnız son nokta/);
      expect(mesajlar(takimProfili(ozel([{ x: 0, dia: 5 }, { x: 20, dia: -1 }])))).toMatch(/negatif/);
      expect(mesajlar(takimProfili(ozel([{ x: 0, dia: 5 }, { x: 20, dia: 5 }, { x: 20, dia: 5 }])))).toMatch(/aynı/);
    });
    it("sayı olmayan satırlar yok sayılır, çökmez", () => {
      const k = takimProfili(ozel([{ x: 0, dia: 8 }, { x: "abc", dia: 3 }, null, { x: 30, dia: 8 }]));
      expect(k.L).toBe(30);
      expect(() => takimProfili(ozel(undefined))).not.toThrow();
    });
  });
});

describe("özel takım: tip geçişi, çizim ve çıktılar", () => {
  it("tipe geçince D, d, L'ye göre başlangıç profili yazılır ve geçerlidir", () => {
    const p = tipDegistir({ ...DEFAULT_PARAMS, D: 8, d: 12, L: 90 }, "custom");
    expect(p.toolType).toBe("custom");
    expect(p.profilNoktalari[0]).toEqual({ x: 0, dia: 12 });
    const g = takimProfili(p);
    expect(g.hatalar).toEqual([]);
    expect(g.L).toBe(90);
    expect(g.d).toBe(12);
  });
  it("başka tipe dönünce özel profil geometriyi etkilemez", () => {
    const c = tipDegistir(DEFAULT_PARAMS, "custom");
    const f = tipDegistir(c, "flat");
    expect(takimProfili(f).tip).toBe("flat");
    expect(takimProfili(f).L).toBe(DEFAULT_PARAMS.L);
  });
  it("sayfada çizilir: yatay parçaların boyu, çapı ve eğim açısı ölçülür; NaN yok", () => {
    const p = ozel([{ x: 0, dia: 10 }, { x: 40, dia: 10 }, { x: 43, dia: 8 }, { x: 70, dia: 8 }, { x: 75, dia: 0 }]);
    const svg = renderToStaticMarkup(h(Sayfa, { params: p, dimOff: {}, setDimOff: () => {} }));
    expect(svg).toContain(">40<");           // sap boyu
    expect(svg).toContain(">27<");           // kesici parça boyu
    expect(svg).toContain("⌀8");
    expect(svg).toContain("18,4°");          // eğim: yarıçap farkı 1 mm, boy 3 mm → atan(1/3)
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("DXF üretilir; kontur noktalardan geçer", () => {
    const dxf = generateDXF(ozel([{ x: 0, dia: 10 }, { x: 40, dia: 10 }, { x: 43, dia: 8 }, { x: 75, dia: 8 }]));
    expect(dxf).toContain("CONTOUR");
    expect(dxf).not.toMatch(/NaN|undefined/);
  });
});
