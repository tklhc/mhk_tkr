import { describe, it, expect } from "vitest";
import { base64urlYaz, base64urlOku, ieBaglantisi, ieBaglantisindanOku, EN_COK_UZUNLUK } from "../src/io/utsKopru.js";
import { isEmriMetniCoz } from "../src/io/isEmri.js";

const IE = `İŞ EMRİ TAKIM BİLGİSİ
İE-818 Std. Freze
114x15,5x45x16x100
Takım Çapı 15,5 mm Helis Boyu 45 mm
Şaft Çapı 16 mm Ağız Sayısı 4
Takım Boyu 100 mm
Çekirdek Çapı 8.525 mm`;

describe("base64url", () => {
  it("Türkçe harfler ve satır sonlarıyla gidiş-dönüş", () => {
    expect(base64urlOku(base64urlYaz(IE))).toBe(IE);
    expect(base64urlOku(base64urlYaz("çğıöşü ÇĞİÖŞÜ ⌀ ° ×"))).toBe("çğıöşü ÇĞİÖŞÜ ⌀ ° ×");
  });
  it("URL'de güvenli: + / = yok", () => {
    for (const m of [IE, ">>>???", "a", "ab", "abc", "ÿÿÿ"]) expect(base64urlYaz(m)).toMatch(/^[A-Za-z0-9_-]*$/);
  });
  it("geçersiz girdi null verir", () => {
    expect(base64urlOku("***")).toBeNull();
    expect(base64urlOku("_w")).toBeNull();                    // geçersiz UTF-8 baytı (0xFF)
  });
  it("uzun metin (parça parça dönüştürme) bozulmaz", () => {
    const uzun = IE.repeat(60);
    expect(base64urlOku(base64urlYaz(uzun))).toBe(uzun);
  });
});

describe("iş emri bağlantısı", () => {
  const adres = "https://ornek.github.io/teknik-resim/";
  it("bağlantı üretilir ve geri okunur", () => {
    const b = ieBaglantisi(IE, adres);
    expect(b.startsWith(`${adres}#ie=`)).toBe(true);
    expect(ieBaglantisindanOku(b.slice(adres.length))).toBe(IE);
  });
  it("tabandaki eski # parçası atılır", () => {
    expect(ieBaglantisi("x", `${adres}#eski`)).toBe(`${adres}#ie=${base64urlYaz("x")}`);
  });
  it("iş emri bağlantısı olmayan ya da boş adres parçası null", () => {
    for (const h of ["", "#", "#baska=1", "#IE=abc", undefined, null]) expect(ieBaglantisindanOku(h)).toBeNull();
    expect(ieBaglantisindanOku("#ie=")).toBeNull();
    expect(ieBaglantisindanOku(`#ie=${base64urlYaz("   \n ")}`)).toBeNull();
  });
  it("bozuk, aşırı uzun ve kontrol karakterli veri reddedilir", () => {
    expect(ieBaglantisindanOku("#ie=***")).toBeNull();
    expect(ieBaglantisindanOku(`#ie=${"A".repeat(EN_COK_UZUNLUK)}`)).toBeNull();
    expect(ieBaglantisindanOku(`#ie=${base64urlYaz("İE-1\u0000gizli")}`)).toBeNull();
    expect(ieBaglantisindanOku(`#ie=${base64urlYaz("İE-1 Std. Freze\nTakım Çapı 10 mm")}`)).not.toBeNull();   // satır sonu serbest
  });
  it("tarayıcının eklediği CRLF temizlenir", () => {
    expect(ieBaglantisindanOku(`#ie=${base64urlYaz("a\r\nb")}`)).toBe("a\nb");
  });
  it("bağlantıdan gelen yazı iş emri okuyucusundan aynı sonucu verir (yapıştırmayla eşdeğer)", () => {
    const b = ieBaglantisi(IE, adres);
    const gelen = ieBaglantisindanOku(b.slice(adres.length));
    expect(isEmriMetniCoz(gelen)).toEqual(isEmriMetniCoz(IE));
    expect(isEmriMetniCoz(gelen).degerler).toMatchObject({ D: 15.5, d: 16, L: 100, l1: 45, z: 4, dCore: 8.525 });
  });
});
