import { describe, it, expect } from "vitest";
import { csvOku, csvMetniOku, csvSatirlari, parseCSV, generateCSVTemplate } from "../src/io/csv.js";

const bayt = (metin, kodlama) => {
  if (kodlama === "windows-1254") {
    // Türkçe harfleri Windows-1254 baytlarına çevir
    const tablo = { "ç": 0xe7, "Ç": 0xc7, "ğ": 0xf0, "Ğ": 0xd0, "ı": 0xfd, "İ": 0xdd, "ö": 0xf6, "Ö": 0xd6, "ş": 0xfe, "Ş": 0xde, "ü": 0xfc, "Ü": 0xdc };
    return Uint8Array.from([...metin].map((c) => (c in tablo ? tablo[c] : c.charCodeAt(0)))).buffer;
  }
  return new TextEncoder().encode(metin).buffer;
};

const BASLIK = "Takım Adı;Takım Tipi;Çap (D);Sap Çapı (d);Toplam Boy (L);Kesici Boy (l1);Boğaz Boyu (l2);Diş Sayısı;Soğutma";

describe("kodlama", () => {
  it("UTF-8 ve BOM", () => {
    expect(csvMetniOku(bayt("\uFEFFÇap", "utf-8"))).toBe("Çap");
  });
  it("Türkçe Excel (Windows-1254) dosyası okunur", () => {
    expect(csvMetniOku(bayt("Çap (D);Boğaz Boyu;İş", "windows-1254"))).toBe("Çap (D);Boğaz Boyu;İş");
  });
});

describe("satır ayırıcı", () => {
  it("tırnak içindeki ayraç ve satır sonu korunur", () => {
    expect(csvSatirlari('a;"b;c";d\n"x\ny";z', ";")).toEqual([["a", "b;c", "d"], ["x\ny", "z"]]);
  });
  it('"" tırnak kaçışı', () => {
    expect(csvSatirlari('"6"" freze";2', ";")).toEqual([['6" freze', "2"]]);
  });
  it("boş satırlar atlanır, CRLF çalışır", () => {
    expect(csvSatirlari("a;b\r\n\r\nc;d\r\n", ";")).toEqual([["a", "b"], ["c", "d"]]);
  });
});

describe("csvOku", () => {
  it("ondalık virgül (Türkçe Excel): 8,5 → 8.5", () => {
    const { items } = csvOku(`${BASLIK}\nT1;Düz Freze;8,5;8;60;20;0;4;Hayır`);
    expect(items[0].D).toBe(8.5);
  });
  it('"Radyüs Freze" ve "Radyus Freze" ikisi de tanınır', () => {
    for (const ad of ["Radyüs Freze", "Radyus Freze", "RADYÜS FREZE"]) {
      expect(csvOku(`${BASLIK}\nT;${ad};12;12;75;30;0;4;Hayır`).items[0].toolType).toBe("bullnose");
    }
  });
  it("bilinmeyen tip ve sayı olmayan değer uyarı verir", () => {
    const { items, uyarilar } = csvOku(`${BASLIK}\nT1;Spiral;abc;10;75;25;0;4;Hayır`);
    expect(items[0].toolType).toBe("flat");
    expect(uyarilar.join("|")).toMatch(/bilinmeyen takım tipi/);
    expect(uyarilar.join("|")).toMatch(/"abc" sayı değil/);
  });
  it("geometri uyarıları CSV uyarısına eklenir", () => {
    const { uyarilar } = csvOku(`${BASLIK}\nT1;Düz Freze;10;10;30;40;0;4;Hayır`);
    expect(uyarilar.some((u) => u.includes("T1") && u.includes("Sap kalmıyor"))).toBe(true);
  });
  it("virgül ve sekme ayraçlı dosya", () => {
    expect(csvOku("Takım Adı,Çap (D)\nA,10").items[0].D).toBe(10);
    expect(csvOku("Takım Adı\tÇap (D)\nA\t10").items[0].D).toBe(10);
  });
  it("şablon hatasız okunur: 8 takım, uyarı yok", () => {
    const { items, uyarilar } = csvOku(generateCSVTemplate());
    expect(items).toHaveLength(8);
    expect(uyarilar).toEqual([]);
  });
  it("parseCSV eski imzayı korur", () => {
    expect(parseCSV(generateCSVTemplate())).toHaveLength(8);
  });
});
