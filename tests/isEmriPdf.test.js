import { describe, it, expect } from "vitest";
import { satirlariBirlestir, pdfMetni } from "../src/io/isEmriPdf.js";
import { isEmriMetniCoz } from "../src/io/isEmri.js";

/** Standart Helvetica ile tek sayfalık, metin katmanlı küçük bir PDF üretir (yalnız ASCII). */
function pdfYap(parcalar) {
  const icerik = parcalar.map(([x, y, t]) => `BT /F1 10 Tf ${x} ${y} Td (${t}) Tj ET`).join("\n");
  const nesneler = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${icerik.length} >>\nstream\n${icerik}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const ofset = [];
  nesneler.forEach((n, i) => { ofset.push(pdf.length); pdf += `${i + 1} 0 obj\n${n}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${nesneler.length + 1}\n0000000000 65535 f \n`;
  for (const o of ofset) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${nesneler.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf).buffer;
}

describe("satırları birleştirme", () => {
  it("aynı yükseklikteki parçalar soldan sağa, satırlar yukarıdan aşağıya", () => {
    const m = satirlariBirlestir([
      { s: "Helis Boyu", x: 200, y: 700, w: 50 }, { s: "45 mm", x: 300, y: 700, w: 30 },
      { s: "Takim Capi", x: 40, y: 700.4, w: 50 }, { s: "15,5 mm", x: 120, y: 700, w: 35 },
      { s: "Saft Capi", x: 40, y: 680, w: 45 }, { s: "16 mm", x: 120, y: 680, w: 30 },
    ]);
    expect(m).toBe("Takim Capi 15,5 mm Helis Boyu 45 mm\nSaft Capi 16 mm");
  });
  it("bitişik parçalar araya boşluk girmeden birleşir, boş parçalar atılır", () => {
    expect(satirlariBirlestir([{ s: "IE", x: 10, y: 5, w: 10 }, { s: "-818", x: 20, y: 5, w: 20 }, { s: "  ", x: 50, y: 5, w: 3 }])).toBe("IE-818");
  });
});

describe("gerçek PDF'den okuma", () => {
  it("metin katmanlı PDF → satırlar → iş emri değerleri", async () => {
    const pdf = pdfYap([
      [40, 800, "IS EMRI IE-818"], [300, 800, "TAKIM BILGISI"], [300, 785, "Std. Freze 114x15,5x45x16x100"],
      [40, 700, "Takim Capi"], [140, 700, "15,5 mm"], [250, 700, "Helis Boyu"], [350, 700, "45 mm"],
      [40, 685, "Saft Capi"], [140, 685, "16 mm"], [250, 685, "Agiz Sayisi"], [350, 685, "4"],
      [40, 670, "Takim Boyu"], [140, 670, "100 mm"],
      [40, 640, "Helis Acisi"], [140, 640, "35"], [250, 640, "Cekirdek Capi"], [350, 640, "8.525 mm"],
    ]);
    const metin = await pdfMetni(pdf);
    expect(metin).toContain("Takim Capi 15,5 mm Helis Boyu 45 mm");
    const s = isEmriMetniCoz(metin);
    expect(s.tip).toBe("flat");
    expect(s.bilgi.ieNo).toBe("İE-818");
    expect(s.degerler).toMatchObject({ D: 15.5, d: 16, L: 100, l1: 45, z: 4, helix: 35, dCore: 8.525 });
  });

  it("metin katmanı olmayan (boş) PDF anlaşılır hata verir", async () => {
    await expect(pdfMetni(pdfYap([]))).rejects.toThrow(/okunabilir metin yok/);
  });
});
