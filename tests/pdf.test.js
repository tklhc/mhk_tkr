import { describe, it, expect } from "vitest";
import { pdfOlustur, rgbaDanRgbye } from "../src/io/pdf.js";

async function pdfAc(bayt) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  globalThis.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const belge = await pdfjs.getDocument({ data: new Uint8Array(bayt), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
  return belge;
}

describe("gerçek ölçekli PDF", () => {
  it("RGBA → RGB dönüşümü alfayı atar", () => {
    expect([...rgbaDanRgbye(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]))]).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("sayfa boyutu kağıt boyutudur: A4 yatay 297×210 mm = 841,89×595,28 pt", async () => {
    const rgb = new Uint8Array(4 * 2 * 3).fill(255);
    const bayt = await pdfOlustur(rgb, 4, 2, 297, 210, "Deneme");
    expect(new TextDecoder("latin1").decode(bayt.slice(0, 8))).toBe("%PDF-1.4");
    const belge = await pdfAc(bayt);
    expect(belge.numPages).toBe(1);
    const sayfa = await belge.getPage(1);
    const [x0, y0, x1, y1] = sayfa.view;
    expect(x1 - x0).toBeCloseTo(297 * 72 / 25.4, 2);
    expect(y1 - y0).toBeCloseTo(210 * 72 / 25.4, 2);
  });

  it("A3 yatay 420×297 mm", async () => {
    const bayt = await pdfOlustur(new Uint8Array(3).fill(0), 1, 1, 420, 297);
    const sayfa = await (await pdfAc(bayt)).getPage(1);
    expect(sayfa.view[2]).toBeCloseTo(420 * 72 / 25.4, 2);
    expect(sayfa.view[3]).toBeCloseTo(297 * 72 / 25.4, 2);
  });

  it("xref ofsetleri nesne başlarını gösterir (dosya bozuk değil)", async () => {
    const bayt = await pdfOlustur(new Uint8Array(12).fill(7), 2, 2, 100, 100);
    const metin = new TextDecoder("latin1").decode(bayt);
    const sx = +/startxref\s+(\d+)/.exec(metin)[1];
    expect(metin.slice(sx, sx + 4)).toBe("xref");
    const satirlar = metin.slice(sx).split("\n").filter((l) => /^\d{10} 00000 n/.test(l));
    expect(satirlar).toHaveLength(6);
    satirlar.forEach((l, i) => expect(metin.slice(+l.slice(0, 10)).startsWith(`${i + 1} 0 obj`)).toBe(true));
  });

  it("resim akışı açılınca özgün pikselleri verir (kayıpsız)", async () => {
    const rgb = Uint8Array.from({ length: 2 * 2 * 3 }, (_, i) => i * 20);
    const bayt = await pdfOlustur(rgb, 2, 2, 50, 50);
    const metin = new TextDecoder("latin1").decode(bayt);
    const bas = metin.indexOf("stream\n", metin.indexOf("/Subtype /Image")) + 7;
    const uzunluk = +/\/Length (\d+)/.exec(metin.slice(metin.indexOf("/Subtype /Image")))[1];
    const akis = bayt.slice(bas, bas + uzunluk);
    const acik = new Uint8Array(await new Response(new Blob([akis]).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());
    expect([...acik]).toEqual([...rgb]);
  });
});
