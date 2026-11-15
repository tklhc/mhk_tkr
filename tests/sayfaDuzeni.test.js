import { describe, it, expect } from "vitest";
import { sayfaDuzeni, olcekYaz, olcekOku, olcekSec } from "../src/drawing/sayfaDuzeni.js";

describe("ölçek", () => {
  it("yazım ve okuma", () => {
    expect(olcekYaz(2)).toBe("2:1");
    expect(olcekYaz(1)).toBe("1:1");
    expect(olcekYaz(0.5)).toBe("1:2");
    expect(olcekYaz(0.2)).toBe("1:5");
    expect(olcekOku("5:1")).toBe(5);
    expect(olcekOku("1:2")).toBe(0.5);
    expect(olcekOku("otomatik")).toBeNull();
  });
  it("seriden sığan en büyük", () => {
    expect(olcekSec([[75, 170]])).toBe(2);
    expect(olcekSec([[75, 140]])).toBe(1);
    expect(olcekSec([[3, 100]])).toBe(20);
  });
});

describe("sayfa düzeni", () => {
  it("A4 yatay: çerçeve ISO 5457, antet 180 mm sağ altta", () => {
    const s = sayfaDuzeni({ kagit: "A4", L: 75, D: 10 });
    expect(s.cerceve).toEqual({ x: 20, y: 10, w: 267, h: 190 });
    expect(s.antet.x + s.antet.w).toBe(287);
    expect(s.antet.y + s.antet.h).toBe(200);
    expect(s.antet.w).toBe(180);
  });

  it("A4'te 75 mm freze 2:1, 150 mm 1:1, 300 mm 1:2", () => {
    expect(sayfaDuzeni({ kagit: "A4", L: 75, D: 10 }).yan.olcek).toBe(2);
    expect(sayfaDuzeni({ kagit: "A4", L: 150, D: 16 }).yan.olcek).toBe(1);
    expect(sayfaDuzeni({ kagit: "A4", L: 300, D: 20 }).yan.olcek).toBe(0.5);
  });

  it("küçük çaplı takımda uç görünüş büyütülür", () => {
    const s = sayfaDuzeni({ kagit: "A4", L: 50, D: 3 });
    expect(s.uc.olcek).toBeGreaterThanOrEqual(10);
  });

  it("elle seçilen ölçek kullanılır, sığmazsa işaretlenir", () => {
    const s = sayfaDuzeni({ kagit: "A4", L: 150, D: 16, olcek: "2:1" });
    expect(s.yan.olcek).toBe(2);
    expect(s.yan.tasiyor).toBe(true);
  });

  it("takım yan görünüş bölgesine sığar", () => {
    for (const [L, D] of [[50, 6], [75, 10], [100, 12], [150, 20], [250, 32]]) {
      const s = sayfaDuzeni({ kagit: "A4", L, D });
      expect(s.yan.ox).toBeGreaterThanOrEqual(s.yan.bolge.x);
      expect(s.yan.ox + L * s.yan.olcek).toBeLessThanOrEqual(s.yan.bolge.x + s.yan.bolge.w);
      expect(s.yan.tasiyor).toBe(false);
    }
  });
});
