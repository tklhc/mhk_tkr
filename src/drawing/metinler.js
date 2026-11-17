// Resim üzerindeki sabit yazılar: Türkçe ve İngilizce. Resim dili `params.dil` ("tr" | "en");
// arayüz (panel, menüler) her zaman Türkçe kalır. Kullanıcının girdiği metinler (alet adı, not, malzeme,
// iş emrinden gelen özellik adları) çevrilmez.

const SOZLUK = {
  tr: {
    alet_adi: "ALET ADI", cizim_no: "ÇİZİM NO", rev: "REV.", tarih: "TARİH", musteri: "MÜŞTERİ", ie_sip: "İE / SİP. NO",
    cizen: "ÇİZEN", onaylayan: "ONAYLAYAN",
    teknik_veri: "TEKNİK VERİ", uretim: "ÜRETİM ÖZELLİKLERİ",
    malzeme: "Malzeme", kaplama: "Kaplama", dis_sayisi: "Diş sayısı", helis: "Helis", kesim_yonu: "Kesim yönü",
    kesici_boy: "Kesici boy", cekirdek: "Çekirdek", sogutma: "Soğutma",
    duz: "Düz", sag: "Sağ", sol: "Sol", evet: "Evet", yok: "Yok",
    uc_gorunus: "UÇTAN GÖRÜNÜŞ", detay: "DETAY", kesit: "KESİT", sematik_kanal: "şematik kanal profili",
    dis_profili: "DİŞ PROFİLİ DETAYI", sematik_dis: "şematik · açı ve genişlik iş emrinden",
    kesme_acisi: "Kesme açısı", sy1: "1. SY", sy2: "2. SY", konik: "Konik",
    sigmiyor: "⚠ Seçilen ölçek ({0}) takımı sayfaya sığdırmıyor",
    kat_katalog: "Takım Kataloğu", kat_dis: "diş", kat_cizim_no: "Çizim no", kat_sayfa: "Sayfa",
    rev_rev: "REV.", rev_tarih: "TARİH", rev_aciklama: "AÇIKLAMA", rev_kisi: "KİŞİ",
    ONAYLANDI: "ONAYLANDI", TASLAK: "TASLAK", "REVİZYON": "REVİZYON", "İPTAL": "İPTAL",
  },
  en: {
    alet_adi: "TOOL NAME", cizim_no: "DRAWING NO", rev: "REV.", tarih: "DATE", musteri: "CUSTOMER", ie_sip: "ORDER NO",
    cizen: "DRAWN BY", onaylayan: "APPROVED BY",
    teknik_veri: "TECHNICAL DATA", uretim: "PRODUCTION DATA",
    malzeme: "Material", kaplama: "Coating", dis_sayisi: "Flutes", helis: "Helix", kesim_yonu: "Cutting dir.",
    kesici_boy: "Flute length", cekirdek: "Core", sogutma: "Coolant",
    duz: "Straight", sag: "Right", sol: "Left", evet: "Yes", yok: "None",
    uc_gorunus: "END VIEW", detay: "DETAIL", kesit: "SECTION", sematik_kanal: "schematic flute profile",
    dis_profili: "TOOTH PROFILE DETAIL", sematik_dis: "schematic · angles and widths from work order",
    kesme_acisi: "Rake angle", sy1: "1st relief", sy2: "2nd relief", konik: "Taper",
    sigmiyor: "⚠ Selected scale ({0}) does not fit the tool on the sheet",
    kat_katalog: "Tool Catalog", kat_dis: "flutes", kat_cizim_no: "Drawing no", kat_sayfa: "Page",
    rev_rev: "REV.", rev_tarih: "DATE", rev_aciklama: "DESCRIPTION", rev_kisi: "BY",
    ONAYLANDI: "APPROVED", TASLAK: "DRAFT", "REVİZYON": "REVISION", "İPTAL": "CANCELLED",
  },
};

export const DILLER = [["tr", "Türkçe"], ["en", "English"]];

/** Resim dili: bilinmeyen değer Türkçe sayılır. */
export const dilSec = (params) => (params?.dil === "en" ? "en" : "tr");

/** Çevrilmiş yazı. Anahtar o dilde yoksa Türkçe'ye, o da yoksa anahtarın kendisine düşer. {0}, {1}… değiştirilir. */
export function mt(params, anahtar, ...degerler) {
  const m = SOZLUK[dilSec(params)][anahtar] ?? SOZLUK.tr[anahtar] ?? anahtar;
  return degerler.reduce((s, v, i) => s.replace(`{${i}}`, v), m);
}

/** Yön değeri ("Sağ" | "Sol") → dile göre yazı. */
export const yonMetni = (params, yon) => mt(params, yon === "Sol" ? "sol" : "sag");

export const SOZLUK_ANAHTARLARI = Object.keys(SOZLUK.tr);
export const SOZLUKLER = SOZLUK;
