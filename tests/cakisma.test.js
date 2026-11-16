import { describe, it, expect } from "vitest";
import { kesisim, cakismaBul } from "../src/drawing/cakisma.js";

const k = (id, x, y, w, h, grup = id, metin = `m${id}`) => ({ id, x, y, w, h, grup, metin });

describe("yazı çakışması", () => {
  it("kesişen kutular bulunur, kesişim alanı doğru", () => {
    const a = k(1, 0, 0, 10, 4), b = k(2, 6, 2, 10, 4);
    const r = kesisim(a, b, 0);
    expect(r).toEqual({ x: 6, y: 2, w: 4, h: 2 });
    expect(cakismaBul([a, b])).toHaveLength(1);
  });
  it("yalnız değen ya da ayrık kutular çakışma sayılmaz", () => {
    expect(cakismaBul([k(1, 0, 0, 10, 4), k(2, 10, 0, 10, 4)])).toHaveLength(0);          // yan yana, değiyor
    expect(cakismaBul([k(1, 0, 0, 10, 4), k(2, 9.9, 0, 10, 4)])).toHaveLength(0);         // pay içinde
    expect(cakismaBul([k(1, 0, 0, 10, 4), k(2, 30, 30, 5, 5)])).toHaveLength(0);
  });
  it("aynı gruptaki (ana yazı + sapmalar) kutular atlanır", () => {
    const g = {};
    expect(cakismaBul([k(1, 0, 0, 10, 4, g), k(2, 5, 0, 10, 4, g)])).toHaveLength(0);
    expect(cakismaBul([k(1, 0, 0, 10, 4, g), k(2, 5, 0, 10, 4, {})])).toHaveLength(1);
  });
  it("üç yazı: yalnız çakışan çiftler listelenir", () => {
    const r = cakismaBul([k(1, 0, 0, 10, 4), k(2, 8, 1, 10, 4), k(3, 40, 40, 5, 5)]);
    expect(r).toHaveLength(1);
    expect([r[0].a.id, r[0].b.id]).toEqual([1, 2]);
  });
  it("boş liste ve tek kutu", () => {
    expect(cakismaBul([])).toEqual([]);
    expect(cakismaBul([k(1, 0, 0, 1, 1)])).toEqual([]);
  });
});
