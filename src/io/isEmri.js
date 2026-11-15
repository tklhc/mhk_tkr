// MİHENK ÜTS iş emri kağıdından (PDF metni ya da yapıştırılan metin) üretim verisi okur
// ve teknik resim parametrelerine çevirir.
//
// Kural: İş emrinde olmayan bir değer UYDURULMAZ. Bulunamayan alan boş/varsayılan kalır ve
// kullanıcıya uyarı olarak bildirilir. Toleranslar iş emrinde yer almadığı için boş bırakılır.

import { tipUygula } from "../geometry/tipler";
import { disProfiliYeterli } from "../geometry/disProfili";

// Karakter sayısını koruyarak Türkçe harfleri sadeleştirir: konumlar özgün metinle aynı kalır.
const HARITA = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", I: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u", " ": " ", "×": "x", "’": "'", "‘": "'" };
export function norm(s) {
  let o = "";
  for (const ch of String(s)) {
    o += HARITA[ch] ?? (ch >= "A" && ch <= "Z" ? ch.toLowerCase() : ch);
  }
  return o;
}

const kacis = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** "1.Alın SY. Açısı" → boşluk ve nokta esnek bir düzenli ifade kaynağı */
const desenYap = (etiket) => kacis(norm(etiket).trim()).replace(/\\\./g, "\\.?").replace(/\s+/g, "\\s*");

// ── Etiket tanımları ──
// kullanim: çizimde kullanılan alan | "ek" (çizilmez, tabloya gider) | "ayirici" (yalnız değer sınırı)
const CIZIM = [
  ["Takım Çapı", "D"], ["Şaft Çapı", "d"], ["Sap Çapı", "d"], ["Takım Boyu", "L"],
  ["Helis Boyu", "l1"], ["Kesici Boy", "l1"], ["Kesici Boyu", "l1"], ["Ağız Sayısı", "z"],
  ["Helis Açısı", "helix"], ["Çekirdek Çapı", "dCore"], ["Köşe Pahı", "kosePahi"],
  ["Köşe Radyusu", "rCorner"], ["Köşe Radyüsü", "rCorner"], ["Uç Açısı", "pointAngle"],
  ["1.Pah Genişliği", "pahGenisligi"], ["Pah Genişliği", "pahGenisligi"],
  ["Küre Radyusu", "kureRadyusu"], ["Küre Radyüsü", "kureRadyusu"],
];
// Çizilmeyen ama üretim için değerli teknik özellikler (ÜTS takım tipi şablonları + ekran yazımları)
const EK = [
  "Kesme Açısı", "Yüzey Genişliği", "Yüzey Açıları", "Yüzey Açısı", "Yüzey Tipi", "Sivriltme Açısı", "Sivrilme Açısı",
  "Gashing Çarpması", "Kısa Diş Genişliği", "Alın Açısı", "Alın Kaçıklığı", "1.Alın SY. Açısı", "2.Alın SY. Açısı", "3.Alın SY. Açısı",
  "1.Alın Açısı", "2.Alın Açısı", "1. Serbest Yüzey Gen.", "2.Serb. Yüzey Gen.", "2. Serbest Yüzey Gen.", "Matkap Yüzey Gen.",
  "Kademe Açısı", "1.Kademe Açısı", "2.Kademe Açısı", "Kanal Talaş Açısı", "Talaş Yüzey Boyunca Radyus", "Pah Açısı",
  "1.SY Genişliği", "2.SY Genişliği",
];
const AYIRICI = [
  "Hammadde Çapı", "Kalitesi", "Kesilecek Boy", "330'dan Çıkan", "Adet", "Hatalı Adet", "Firma", "Kaplama Çeşidi", "Drag Finish", "Not",
  "Takım Özellikleri", "Teknik Özellikler", "Kalite Kontrol", "Kaplama", "Üretim", "Kesim", "Bitirince QR okut", "QR okut", "Bitiş",
  "Tarih", "Teslim", "Müşteri", "Öncelik", "Takım Bilgisi", "İş Emri",
];

/** Tek bir etiketin tüm eşleşmelerini bulur. Tek harfli "Çap" etiketi yalnız tek başına eşleşir. */
const ETIKETLER = [
  ...CIZIM.map(([ad, k]) => ({ ad, kullanim: k, re: new RegExp(desenYap(ad), "g") })),
  { ad: "Çap", kullanim: "D", re: /(?<![a-z])cap(?![a-z])/g },
  ...EK.map((ad) => ({ ad, kullanim: "ek", re: new RegExp(desenYap(ad), "g") })),
  ...AYIRICI.map((ad) => ({ ad, kullanim: "ayirici", re: new RegExp(`(?<![a-z])${desenYap(ad)}(?![a-z])`, "g") })),
];

// Takım tipi adları (ÜTS) → çizim tipi. Sıra önemli: özel olan önce.
const TIPLER = [
  ["std\\.?\\s*havsali\\s*matkap", "stepdrill"], ["cok\\s*kademeli\\s*matkap", "stepdrill"], ["kademeli\\s*matkap", "stepdrill"],
  ["konik\\s*rayba", "taperreamer"], ["rayba", "reamer"],
  ["chatter\\s*free\\s*freze", "flat"], ["kure\\s*freze", "ballnose"], ["radyus(?:lu)?\\s*freze", "bullnose"],
  ["aluminyum\\s*freze", "flat"], ["pah\\s*freze", "chamfer"], ["t\\s*-?\\s*freze", "tslot"],
  ["matkap", "drill"], ["std\\.?\\s*freze", "flat"], ["ozel\\s*takim", "flat"], ["freze", "flat"],
];

const BOS = /^[\s_\-—–.:/]*$/;
/** Boş yer tutucuları ("____", "—", "☐") ve bölüm işaretlerini ayıklar. */
const temizle = (s) => String(s ?? "").replace(/[①②③④⑤⑥⑦⑧⑨■□☐☑→▸]/g, " ").replace(/_{2,}/g, " ").replace(/\s+/g, " ").trim();
const bosMu = (s) => BOS.test(temizle(s));

function sayiOku(ham) {
  const m = /-?\d+(?:[.,]\d+)?/.exec(String(ham ?? ""));
  if (!m) return null;
  const v = parseFloat(m[0].replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

/** Çizimde kullanılan alanların açıklaması (onay penceresinde gösterilir) */
const KULLANIM_AD = {
  D: "Kesici çap (D)", d: "Sap çapı (d)", L: "Toplam boy (L)", l1: "Kesici boy (l₁)", z: "Diş sayısı (z)",
  helix: "Helis açısı", dCore: "Çekirdek çapı (dc)", kosePahi: "Köşe pahı", rCorner: "Köşe radyüsü (R)",
  pointAngle: "Uç açısı", pahGenisligi: "Giriş pahı", kureRadyusu: "Küre radyüsü (D/2 ile karşılaştırılır)",
};

/**
 * Metinden iş emri verisini çıkarır.
 * @returns {{
 *   tip: string|null, tipAdi: string, tipKodu: string,
 *   degerler: Record<string, number>,           // çizimde kullanılacak sayılar
 *   bulunan: Array<{ etiket: string, ham: string, kullanim: string }>,
 *   ekOzellikler: Array<[string, string]>,
 *   bilgi: { ieNo, tarih, teslim, musteri, kalite, kaplama },
 *   uyarilar: string[]
 * }}
 */
export function isEmriMetniCoz(metin) {
  const ozgun = String(metin ?? "").replace(/\r/g, "");
  const n = norm(ozgun);
  const uyarilar = [];

  // 1) Etiket eşleşmeleri (uzun olan öncelikli, çakışma yok)
  const adaylar = [];
  for (const e of ETIKETLER) {
    e.re.lastIndex = 0;
    let m;
    while ((m = e.re.exec(n)) !== null) {
      if (m[0].length === 0) { e.re.lastIndex++; continue; }
      adaylar.push({ bas: m.index, son: m.index + m[0].length, ad: e.ad, kullanim: e.kullanim });
    }
  }
  adaylar.sort((a, b) => (b.son - b.bas) - (a.son - a.bas) || a.bas - b.bas);
  const kabul = [];
  for (const a of adaylar) if (!kabul.some((k) => a.bas < k.son && k.bas < a.son)) kabul.push(a);
  kabul.sort((a, b) => a.bas - b.bas);

  const bulunan = [];
  const degerler = {};
  const ekOzellikler = [];
  const bilgi = { ieNo: "", tarih: "", teslim: "", musteri: "", kalite: "", kaplama: "" };
  const gorulen = new Set();

  kabul.forEach((k, i) => {
    const sonraki = kabul[i + 1];
    const ham = temizle(ozgun.slice(k.son, sonraki ? sonraki.bas : ozgun.length)).slice(0, 60);
    if (k.kullanim === "ayirici") {
      if (k.ad === "Kalitesi" && !bosMu(ham)) bilgi.kalite = ham.split(" ")[0];
      if (k.ad === "Kaplama Çeşidi" && !bosMu(ham)) bilgi.kaplama = ham;
      return;
    }
    if (gorulen.has(k.kullanim) && k.kullanim !== "ek") return; // aynı alan iki kez: ilki geçerli
    if (k.kullanim === "ek") {
      if (!bosMu(ham)) { ekOzellikler.push([k.ad, ham]); bulunan.push({ etiket: k.ad, ham, kullanim: "Üretim özelliği (çizilmez)" }); }
      return;
    }
    const v = sayiOku(ham);
    if (v == null) { uyarilar.push(`"${k.ad}" bulundu ama sayı okunamadı ("${ham}").`); return; }
    gorulen.add(k.kullanim);
    degerler[k.kullanim] = v;
    bulunan.push({ etiket: k.ad, ham, kullanim: KULLANIM_AD[k.kullanim] || k.kullanim });
  });

  // 2) Başlık: iş emri no, takım tipi ve kodu
  const ie = /(?<![a-z])ie\s*-\s*(\d+)/.exec(n);
  if (ie) bilgi.ieNo = `İE-${ie[1]}`;

  const bas = n.indexOf("takim bilgisi");
  const bolge = bas >= 0 ? n.slice(bas + 13, bas + 13 + 120) : n.slice(0, 400);
  const bolgeOz = bas >= 0 ? ozgun.slice(bas + 13, bas + 13 + 120) : ozgun.slice(0, 400);
  let tip = null, tipAdi = "";
  for (const [re, t] of TIPLER) {
    const m = new RegExp(re).exec(bolge);
    if (m) { tip = t; tipAdi = temizle(bolgeOz.slice(m.index, m.index + m[0].length)); break; }
  }
  const kod = /\d+(?:[.,]\d+)?(?:\s*x\s*\d+(?:[.,]\d+)?){2,}/.exec(bolge);
  const tipKodu = kod ? temizle(bolgeOz.slice(kod.index, kod.index + kod[0].length)).replace(/\s*x\s*/g, "x") : "";
  if (!tip) uyarilar.push("Takım tipi okunamadı; Düz Freze varsayıldı. Tipi Takım sekmesinden seçin.");
  if (tip && /ozel\s*takim/.test(bolge)) uyarilar.push("Özel takım: tip belirsiz, Düz Freze olarak çizildi; geometriyi elle düzeltin.");

  // 3) Tarih / teslim / müşteri (üst satırlar etiketli, altındaki satır değerli olabilir)
  const basEtiket = /tarih[\s\S]{0,40}?teslim[\s\S]{0,40}?musteri[\s\S]{0,40}?adet[\s\S]{0,40}?oncelik/.exec(n);
  if (basEtiket) {
    const sonrasi = ozgun.slice(basEtiket.index + basEtiket[0].length, basEtiket.index + basEtiket[0].length + 140);
    const satir = temizle(sonrasi.split("\n").find((x) => temizle(x)) ?? sonrasi);
    const mm = /^(\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4})\s+(.*?)\s+(\d+)\s+(normal|yuksek|acil|high|urgent|dusuk)\b/d.exec(norm(satir));
    if (mm) {
      bilgi.tarih = satir.slice(0, mm[1].length);
      const orta = satir.slice(mm.indices[2][0], mm.indices[2][1]);
      const t2 = /^(\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4})\s*(.*)$/.exec(orta);
      if (t2) { bilgi.teslim = t2[1]; if (!bosMu(t2[2])) bilgi.musteri = temizle(t2[2]); }
      else if (!bosMu(orta)) bilgi.musteri = temizle(orta);
    }
  }

  // 4) Takım kodundan yedek okuma (yalnız etiket okunamadıysa): ÜTS frezelerinde kod = <seri>×D×helis boyu×şaft×boy
  const kodSayilari = tipKodu ? tipKodu.split("x").map((s) => parseFloat(s.replace(",", "."))) : [];
  const frezeBicimi = ["flat", "ballnose", "bullnose", "chamfer", "tslot", "reamer", "taperreamer"].includes(tip) && kodSayilari.length === 5 && kodSayilari.every(Number.isFinite);
  if (frezeBicimi) {
    const [, kD, kl1, kd, kL] = kodSayilari;
    const kontrol = [["D", kD, "Takım çapı"], ["l1", kl1, "Helis boyu"], ["d", kd, "Şaft çapı"], ["L", kL, "Takım boyu"]];
    for (const [anahtar, kv, ad] of kontrol) {
      if (degerler[anahtar] == null) {
        degerler[anahtar] = kv;
        bulunan.push({ etiket: `${ad} (takım kodundan)`, ham: String(kv), kullanim: KULLANIM_AD[anahtar] });
        uyarilar.push(`${ad} etiketi okunamadı; takım kodundaki değer (${kv}) kullanıldı.`);
      } else if (Math.abs(degerler[anahtar] - kv) > 1e-6) {
        uyarilar.push(`${ad} ile takım kodu uyuşmuyor: etiket ${degerler[anahtar]}, kod ${kv}. Etiket değeri kullanıldı; kontrol edin.`);
      }
    }
  }

  // 5) Zorunlu ölçüler
  for (const [k, ad] of [["D", "Takım çapı"], ["d", "Şaft çapı"], ["L", "Takım boyu"]]) {
    if (!(degerler[k] > 0)) uyarilar.push(`${ad} bulunamadı: çizimde mevcut değer korundu, elle girin.`);
  }
  return { tip, tipAdi, tipKodu, degerler, bulunan, ekOzellikler, bilgi, uyarilar };
}

// İş emri etiketi → diş profili alanı (norm ile karşılaştırılır). Eşleme etiketlerin okunuşuna göredir:
// "1./2. serbest yüzey genişliği" ile "1./2. alın SY açısı" aynı satırda çifttir.
const DIS_ETIKETLERI = {
  dpKesme: ["Kesme Açısı"],
  dpSy1Gen: ["1. Serbest Yüzey Gen.", "1.SY Genişliği"],
  dpSy1Aci: ["1.Alın SY. Açısı", "1.Alın Açısı"],
  dpSy2Gen: ["2.Serb. Yüzey Gen.", "2. Serbest Yüzey Gen.", "2.SY Genişliği"],
  dpSy2Aci: ["2.Alın SY. Açısı", "2.Alın Açısı"],
};

/** Ek özelliklerden diş profili sayılarını çıkarır; bulunamayan alan 0 (girilmedi) olur. */
export function disProfiliDegerleri(ekOzellikler) {
  const sonuc = { dpKesme: 0, dpSy1Gen: 0, dpSy1Aci: 0, dpSy2Gen: 0, dpSy2Aci: 0 };
  for (const [alan, adlar] of Object.entries(DIS_ETIKETLERI)) {
    const hedef = adlar.map((a) => norm(a).replace(/[\s.]/g, ""));
    const bulunan = (ekOzellikler || []).find(([ad]) => hedef.includes(norm(ad).replace(/[\s.]/g, "")));
    const v = bulunan ? sayiOku(bulunan[1]) : null;
    if (v != null) sonuc[alan] = v;
  }
  return sonuc;
}

const gecerliTarih = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) || /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(s);
  if (!m) return "";
  const [y, mo, d] = m[1].length === 4 ? [m[1], m[2], m[3]] : [m[3], m[2], m[1]];
  return +mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31 ? `${y}-${mo}-${d}` : "";
};

/**
 * Okunan veriyi resim parametrelerine çevirir. Bulunamayan değer eski halinde kalmaz:
 * tip ön ayarı uygulanır, ardından yalnız İE'den gelenler üzerine yazılır.
 * @returns {{ params: object, uyarilar: string[] }}
 */
export function isEmriParametreleri(sonuc, mevcut) {
  const g = sonuc.degerler;
  const uyarilar = [...sonuc.uyarilar];
  const tip = sonuc.tip || "flat";
  const taban = {
    ...mevcut,
    D: g.D > 0 ? g.D : mevcut.D, d: g.d > 0 ? g.d : mevcut.d, L: g.L > 0 ? g.L : mevcut.L,
  };
  let p = tipUygula(taban, tip);

  // Doğrudan okunanlar
  if (g.l1 > 0) p.l1 = g.l1;
  if (g.z >= 1) p.z = Math.round(g.z);
  if (g.helix >= 0 && g.helix != null) p.helix = g.helix;
  if (g.dCore > 0) p.dCore = g.dCore;
  if (g.pointAngle > 0 && (tip === "drill" || tip === "stepdrill")) p.pointAngle = g.pointAngle;
  if (tip === "bullnose" && g.rCorner > 0) p.rCorner = g.rCorner;
  if (g.kosePahi > 0) {
    if (tip === "flat") p.chamferSize = g.kosePahi;
    else uyarilar.push(`Köşe pahı (${g.kosePahi}) bu takım tipinde çizilmedi; üretim özellikleri tablosuna eklendi.`);
  }
  if (g.pahGenisligi > 0 && (tip === "reamer" || tip === "chamfer")) p.chamferSize = g.pahGenisligi;
  if (g.kureRadyusu > 0 && tip === "ballnose" && Math.abs(g.kureRadyusu - p.D / 2) > 0.01) uyarilar.push(`Küre radyüsü (${g.kureRadyusu}) çap/2 (${p.D / 2}) ile uyuşmuyor.`);
  if (g.rCorner > 0 && tip !== "bullnose") uyarilar.push(`Köşe radyüsü (${g.rCorner}) bu takım tipinde çizilmedi.`);

  // Çizilemeyen/okunamayan: dürüstçe bildir
  if (tip === "stepdrill") uyarilar.push("Kademe çapları ve boyları iş emrinde yok: iki kademeli varsayılan çizildi. Takım sekmesinden kademeleri girin.");
  if (tip === "taperreamer") uyarilar.push("Koniklik ve uç çapı iş emrinde yok: 1:50 varsayılan çizildi. Takım sekmesinden uç çapını girin.");
  if (tip === "tslot") uyarilar.push("T-freze baş genişliği ve boğaz ölçüleri iş emrinde yok: varsayılan çizildi.");
  if (tip === "chamfer" && !(g.pahGenisligi > 0)) uyarilar.push("Pah ölçüsü iş emrinde yok: varsayılan pah çizildi.");
  if (!(g.l1 > 0) && tip !== "stepdrill") uyarilar.push("Kesici/helis boyu okunamadı: varsayılan kesici boy kullanıldı.");
  uyarilar.push("Toleranslar iş emrinde yok: ölçü toleransları boş bırakıldı (Takım sekmesinden girin).");
  uyarilar.push("Helis yönü ve kesim yönü iş emrinde yok: Sağ varsayıldı.");

  // Toleransları, sapı ve soğutmayı temizle (önceki çalışmadan kalmasın)
  Object.assign(p, { tolD: "", told: "", tolL: "", toll1: "", toll2: "", tolNeck: "", tolTip: "", sapTipi: "HA", sapDuzUzunluk: 0, sapDuzDerinlik: 0, coolantHole: false });
  // Önceki çalışmanın belge bilgileri yeni resme taşınmasın (çizen ve sayfa tercihleri kalır)
  Object.assign(p, { drawingNo: "", revision: "", approvedBy: "", notes: [], stamp: "", stampDate: "" });

  // Belge bilgileri
  const b = sonuc.bilgi;
  const ad = [sonuc.tipAdi, sonuc.tipKodu].filter(Boolean).join(" ");
  if (ad) p.toolName = ad;
  p.orderNo = b.ieNo || "";
  p.customerName = b.musteri || "";
  p.deliveryDate = gecerliTarih(b.teslim);
  p.material = b.kalite ? `Karbür (${b.kalite})` : "Karbür";
  p.coating = b.kaplama || "";
  p.ekOzellikler = sonuc.ekOzellikler;
  p.ekGoster = true;
  Object.assign(p, disProfiliDegerleri(sonuc.ekOzellikler));
  const dp = disProfiliDegerleri(sonuc.ekOzellikler);
  if (disProfiliYeterli(dp)) {
    uyarilar.push("Diş profili detayı: 'Kesme Açısı' talaş açısı (γ), '1./2. Serbest Yüzey Gen.' ve '1./2.Alın SY. Açısı' 1./2. serbest yüzeyin genişliği ve açısı olarak yorumlandı; iş emrindeki anlamlarını kontrol edin.");
  } else if (Object.values(dp).some((v) => v > 0)) {
    uyarilar.push("Diş profili detayı çizilmedi: kesme açısı ve 1. serbest yüzey (genişlik + açı) birlikte gerekli.");
  }
  p.cizimTuru = "ie";   // iş emrinden gelen resim iş emri çizimidir (müşteriye vermek için türü değiştirin)
  return { params: p, uyarilar };
}
