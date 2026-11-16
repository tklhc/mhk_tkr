import { describe, it, expect } from "vitest";
import { isEmriMetniCoz, isEmriParametreleri, norm } from "../src/io/isEmri.js";
import { takimProfili } from "../src/geometry/profil.js";
import { DEFAULT_PARAMS } from "../src/constants.js";

// MİHENK ÜTS "İŞ EMRİ" kağıdının (İE-818, Std. Freze) PDF'den satır satır çıkan metni
const IE_818 = `İŞ EMRİ TAKIM BİLGİSİ
İE-818 Std. Freze
114x15,5x45x16x100
TARİH TESLİM MÜŞTERİ ADET ÖNCELİK
2026-11-15 __/__/____ — 0 NORMAL
① KESİM Bitirince QR okut →
Hammadde Çapı 16
Kalitesi BM-1
Kesilecek Boy 100 mm
Adet 1
330'dan Çıkan 3
■ BİTİŞ
③ ÜRETİM (CNC) Bitirince QR okut →
TAKIM ÖZELLİKLERİ
Takım Çapı 15,5 mm Helis Boyu 45 mm
Şaft Çapı 16 mm Ağız Sayısı 4
Takım Boyu 100 mm
TEKNİK ÖZELLİKLER
Helis Açısı 35 ° Sivrilme Açısı 35/45 °
Çekirdek Çapı 8.525 mm Köşe Pahı 0.264
Kesme Açısı 8 ° Kısa Diş Genişliği 4.65 mm
Yüzey Tipi Serbest Yüzey Alın Açısı 1.5 °
1. Serbest Yüzey Gen. 1.033 mm 1.Alın SY. Açısı 8 °
2.Serb. Yüzey Gen. 2.067 mm 2.Alın SY. Açısı 16 °
Yüzey Açıları 8/16 °
④ KALİTE KONTROL QR okut →
Hatalı Adet ____
Not
⑥ KAPLAMA (Opsiyonel)
Firma ____
Kaplama Çeşidi ____
Drag Finish ☐ Yok`;

describe("norm", () => {
  it("Türkçe harfleri sadeleştirir ve uzunluğu korur", () => {
    const s = "İŞ EMRİ Çapı Şaft Ağız Üretim Öncelik ıİ";
    expect(norm(s)).toBe("is emri capi saft agiz uretim oncelik ii");
    expect(norm(s).length).toBe(s.length);
  });
});

describe("İE-818 (Std. Freze)", () => {
  const s = isEmriMetniCoz(IE_818);

  it("tip, takım kodu ve iş emri no", () => {
    expect(s.tip).toBe("flat");
    expect(s.tipAdi).toBe("Std. Freze");
    expect(s.tipKodu).toBe("114x15,5x45x16x100");
    expect(s.bilgi.ieNo).toBe("İE-818");
    expect(s.bilgi.kalite).toBe("BM-1");
  });

  it("çizimde kullanılan ölçüler", () => {
    expect(s.degerler).toMatchObject({ D: 15.5, d: 16, L: 100, l1: 45, z: 4, helix: 35, dCore: 8.525, kosePahi: 0.264 });
  });

  it("çizilmeyen özellikler tabloya gider", () => {
    const ek = Object.fromEntries(s.ekOzellikler);
    expect(ek["Kesme Açısı"]).toBe("8 °");
    expect(ek["Kısa Diş Genişliği"]).toBe("4.65 mm");
    expect(ek["Yüzey Tipi"]).toBe("Serbest Yüzey");
    expect(ek["Alın Açısı"]).toBe("1.5 °");
    expect(ek["1. Serbest Yüzey Gen."]).toBe("1.033 mm");
    expect(ek["2.Serb. Yüzey Gen."]).toBe("2.067 mm");
    expect(ek["1.Alın SY. Açısı"]).toBe("8 °");
    expect(ek["2.Alın SY. Açısı"]).toBe("16 °");
    expect(ek["Yüzey Açıları"]).toBe("8/16 °");
    expect(ek["Sivrilme Açısı"]).toBe("35/45 °");
  });

  it("boş yer tutucular (müşteri —, kaplama ____) değer sayılmaz", () => {
    expect(s.bilgi.musteri).toBe("");
    expect(s.bilgi.kaplama).toBe("");
    expect(s.bilgi.teslim).toBe("");
  });

  it("takım kodu ile etiketler tutarlıysa uyarı yok", () => {
    expect(s.uyarilar.filter((u) => /uyuşmuyor|okunamadı/.test(u))).toEqual([]);
  });

  it("çizim parametreleri: ölçüler, köşe pahı, belge bilgileri; toleranslar boş", () => {
    const { params: p, uyarilar } = isEmriParametreleri(s, { ...DEFAULT_PARAMS, tolD: "h6", L: 60, sapTipi: "HB", coolantHole: true, drawingNo: "ESKI-1", revision: "C", approvedBy: "X", notes: [{ text: "n" }], stamp: "ONAYLANDI" });
    expect(p).toMatchObject({
      toolType: "flat", D: 15.5, d: 16, L: 100, l1: 45, z: 4, helix: 35, dCore: 8.525, chamferSize: 0.264, l2: 0,
      toolName: "Std. Freze 114x15,5x45x16x100", orderNo: "İE-818", material: "Karbür (BM-1)", coating: "",
      tolD: "", told: "", tolL: "", toll1: "", sapTipi: "HA", coolantHole: false, cizimTuru: "ie",
      drawingNo: "", revision: "", approvedBy: "", notes: [], stamp: "",
    });
    expect(p.ekOzellikler).toHaveLength(10);
    expect(uyarilar.join("|")).toMatch(/Toleranslar iş emrinde yok/);
    expect(uyarilar.join("|")).toMatch(/Helis yönü ve kesim yönü/);
    expect(takimProfili(p).hatalar).toEqual([]);
  });
});

describe("diğer yerleşimler ve tipler", () => {
  it("etiket ve değerlerin her biri ayrı satırda olsa da okunur", () => {
    const metin = ["TAKIM BİLGİSİ Std. Freze", "Takım Çapı", "10 mm", "Şaft Çapı", "10 mm", "Takım Boyu", "75 mm", "Helis Boyu", "25 mm", "Ağız Sayısı", "4"].join("\n");
    const s = isEmriMetniCoz(metin);
    expect(s.degerler).toMatchObject({ D: 10, d: 10, L: 75, l1: 25, z: 4 });
  });

  it("matkap: 'Çap' ve 'Kesici Boy' etiketleri, uç açısı", () => {
    const s = isEmriMetniCoz("İE-900 TAKIM BİLGİSİ Matkap 8x80\nÇap 8 mm Şaft Çapı 8 mm\nTakım Boyu 80 mm Kesici Boy 50 mm\nAğız Sayısı 2\nHelis Açısı 30 ° Çekirdek Çapı 2.4 mm\nKesme Açısı 12 ° Uç Açısı 140 °");
    expect(s.tip).toBe("drill");
    expect(s.degerler).toMatchObject({ D: 8, d: 8, L: 80, l1: 50, z: 2, helix: 30, dCore: 2.4, pointAngle: 140 });
    const { params: p } = isEmriParametreleri(s, DEFAULT_PARAMS);
    expect(p).toMatchObject({ toolType: "drill", D: 8, L: 80, l1: 50, pointAngle: 140, l2: 0 });
    expect(takimProfili(p).hatalar).toEqual([]);
  });

  it("radyuslu freze: köşe radyüsü R olarak çizilir, pah değil", () => {
    const s = isEmriMetniCoz("TAKIM BİLGİSİ Radyus Freze\nTakım Çapı 12 mm Helis Boyu 30 mm\nŞaft Çapı 12 mm Ağız Sayısı 4\nTakım Boyu 75 mm\nHelis Açısı 35 ° Köşe Radyusu 1 mm");
    expect(s.tip).toBe("bullnose");
    const { params: p } = isEmriParametreleri(s, DEFAULT_PARAMS);
    expect(p).toMatchObject({ toolType: "bullnose", rCorner: 1, chamferSize: 0 });
  });

  it("kademeli matkap: kademeler iş emrinde yok, açıkça uyarılır", () => {
    const s = isEmriMetniCoz("TAKIM BİLGİSİ Kademeli Matkap (180°)\nÇap 6 mm Şaft Çapı 6 mm Takım Boyu 60 mm Kesici Boy 20 mm Ağız Sayısı 2");
    expect(s.tip).toBe("stepdrill");
    const { uyarilar } = isEmriParametreleri(s, DEFAULT_PARAMS);
    expect(uyarilar.join("|")).toMatch(/Kademe çapları ve boyları iş emrinde yok/);
  });

  it("küçük boyutlu takım kodu etiket eksikse yedek olarak kullanılır ve bildirilir", () => {
    const s = isEmriMetniCoz("TAKIM BİLGİSİ Std. Freze 114x15,5x45x16x100\nAğız Sayısı 4");
    expect(s.degerler).toMatchObject({ D: 15.5, l1: 45, d: 16, L: 100 });
    expect(s.uyarilar.join("|")).toMatch(/takım kodundaki değer/);
  });

  it("etiket ile takım kodu uyuşmazsa uyarı verir", () => {
    const s = isEmriMetniCoz("TAKIM BİLGİSİ Std. Freze 114x15,5x45x16x100\nTakım Çapı 15 mm Şaft Çapı 16 mm Takım Boyu 100 mm Helis Boyu 45 mm");
    expect(s.degerler.D).toBe(15);
    expect(s.uyarilar.join("|")).toMatch(/Takım çapı ile takım kodu uyuşmuyor/);
  });

  it("tanınmayan metin: hiçbir şey uydurulmaz, zorunlu ölçüler için uyarı verir", () => {
    const s = isEmriMetniCoz("Bu bir iş emri değil.");
    expect(s.tip).toBeNull();
    expect(s.degerler).toEqual({});
    expect(s.uyarilar.join("|")).toMatch(/Takım tipi okunamadı/);
    expect(s.uyarilar.join("|")).toMatch(/Takım çapı bulunamadı/);
    const { params } = isEmriParametreleri(s, DEFAULT_PARAMS);
    expect(params.D).toBe(DEFAULT_PARAMS.D); // mevcut değer korunur
  });

  it("müşteri ve teslim tarihi dolu satır", () => {
    const s = isEmriMetniCoz("İE-5 TAKIM BİLGİSİ Std. Freze\nTARİH TESLİM MÜŞTERİ ADET ÖNCELİK\n2026-11-15 2026-11-20 ABC Makina Ltd 3 YÜKSEK\nTakım Çapı 10 mm");
    expect(s.bilgi.teslim).toBe("2026-11-20");
    expect(s.bilgi.musteri).toBe("ABC Makina Ltd");
    const { params } = isEmriParametreleri(s, DEFAULT_PARAMS);
    expect(params).toMatchObject({ deliveryDate: "2026-11-20", customerName: "ABC Makina Ltd", orderNo: "İE-5" });
  });
});

// Gerçek İE-831 (ÜTS kağıdından okunan metin, müşteri bilgisi yok)
const IE831 = `TAKIM BİLGİSİ
İŞ EMRİ
Std. Havşalı Matkap (90°)
İE-831
921-1513/Ø16,4+Ø18
TARİH TESLİM MÜŞTERİ ADET ÖNCELİK
2026-11-16 __/__/____ — 0 NORMAL
① KESİM Bitirince QR okut →
Hammadde Çapı 18
Kesilecek Boy 82 mm
③ ÜRETİM (CNC) Bitirince QR okut →
TAKIM ÖZELLİKLERİ
Çap 16,4 mm Kademe Boyu 10 mm
Şaft Çapı 18 mm Helis Boyu 30 mm
Takım Boyu 82 mm Ağız Sayısı 2
TEKNİK ÖZELLİKLER
Helis Açısı 30 ° Uç Açısı 140 ° ■ BİTİŞ
Çekirdek Çapı 4,95 mm Kademe Açısı 90 °
Kesme Açısı 8 °`;

describe("İE-831 (Std. Havşalı Matkap)", () => {
  const s = isEmriMetniCoz(IE831);
  const { params: p, uyarilar } = isEmriParametreleri(s, DEFAULT_PARAMS);
  it("çap ve kademe boyu ayrı okunur, havşa çapı koddan gelir", () => {
    expect(s.tip).toBe("stepdrill");
    expect(s.degerler).toMatchObject({ D: 16.4, kademeBoyu: 10, d: 18, l1: 30, L: 82, pointAngle: 140, havsaCap: 18 });
    expect(s.tipKodu).toBe("921-1513/Ø16,4+Ø18");
  });
  it("kademeler: Ø16,4 uç konisinden sonra 10 mm, 90° havşa ile Ø18; tahmini Ø23 yok", () => {
    expect(p.kademeOlcu).toBe("toplam");
    expect(p.steps.map((k) => k.dia)).toEqual([16.4, 18]);
    expect(p.steps[1].angle).toBe(90);
    const g = takimProfili(p);
    expect(g.hatalar).toEqual([]);
    const [k0, k1] = g.kademeler;
    const koni = 8.2 / Math.tan((70 * Math.PI) / 180);
    // Ø16,4 silindiri: koni bitişinden havşa başlangıcına tam 10 mm
    expect(k0.sag - k0.gecisBoyu - (k0.sol)).toBeCloseTo(10, 2);
    expect(g.L - k0.sol - koni).toBeCloseTo(10, 2);
    // Helis boyu uçtan 30 mm: Ø18 kademesi sapa 30 mm'de ulaşır
    expect(g.L - k1.sol).toBeCloseTo(30, 6);
    expect(g.l1).toBeCloseTo(30, 6);
    expect(Math.max(...g.kademeler.map((k) => k.dia))).toBe(18);
  });
  it("Kademe Boyu üretim özelliklerinde, açıklayıcı not var, 'varsayılan çizildi' uyarısı yok", () => {
    expect(p.ekOzellikler[0]).toEqual(["Kademe Boyu", "10 mm"]);
    expect(p.ekOzellikler.some(([a]) => /Kademe Açısı/.test(a))).toBe(false);
    expect(uyarilar.some((u) => /Havşalı matkap: Ø16.4/.test(u))).toBe(true);
    expect(uyarilar.some((u) => /varsayılan çizildi/.test(u) && /Kademe/.test(u))).toBe(false);
  });
  it("takım kodu yoksa şaft çapı kullanılır ve uyarılır; helis boyu yetmezse eski varsayılana düşer", () => {
    const kodsuz = IE831.replace("921-1513/Ø16,4+Ø18\n", "");
    const r = isEmriParametreleri(isEmriMetniCoz(kodsuz), DEFAULT_PARAMS);
    expect(r.params.steps[1].dia).toBe(18);
    expect(r.uyarilar.some((u) => /Havşa çapı takım kodunda/.test(u))).toBe(true);
    const kisa = isEmriParametreleri(isEmriMetniCoz(IE831.replace("Helis Boyu 30 mm", "Helis Boyu 12 mm")), DEFAULT_PARAMS);
    expect(kisa.params.kademeOlcu).not.toBe("toplam");
    expect(kisa.uyarilar.some((u) => /kapsamıyor/.test(u))).toBe(true);
  });
});
