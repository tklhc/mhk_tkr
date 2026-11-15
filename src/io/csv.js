import { DEFAULT_PARAMS } from "../constants";
import { takimProfili } from "../geometry/profil";

// Türkçe → İngilizce başlık eşleme
const CSV_HEADER_MAP = {
  "Takım Adı":"toolName","Takım Tipi":"toolType",
  "Çap (D)":"D","Sap Çapı (d)":"d","Toplam Boy (L)":"L",
  "Kesici Boy (l1)":"l1","Boğaz Boyu (l2)":"l2",
  "Diş Sayısı":"z","Helis Açısı":"helix","Çekirdek Çapı":"dCore",
  "Malzeme":"material","Kaplama":"coating",
  "Boğaz Çapı":"neckDia","Geçiş Açısı":"neckAngle",
  "Köşe R":"rCorner","Pah Boyu":"chamferSize",
  "Uç Açısı":"pointAngle","Soğutma":"coolantHole","Soğutma Adet":"coolantCount",
  "Tol D":"tolD","Tol d":"told","Tol l1":"toll1",
  "Çizim No":"drawingNo","Revizyon":"revision","Müşteri":"customerName","Sipariş No":"orderNo","Tol L":"tolL","Tol l2":"toll2","Tol Boğaz":"tolNeck",
  "KD1 Çap":"step1_dia","KD1 Boy":"step1_len","KD1 Açı":"step1_angle","KD1 Tol Çap":"step1_tolDia","KD1 Tol Boy":"step1_tolLen",
  "KD2 Çap":"step2_dia","KD2 Boy":"step2_len","KD2 Açı":"step2_angle","KD2 Tol Çap":"step2_tolDia","KD2 Tol Boy":"step2_tolLen",
  "KD3 Çap":"step3_dia","KD3 Boy":"step3_len","KD3 Açı":"step3_angle","KD3 Tol Çap":"step3_tolDia","KD3 Tol Boy":"step3_tolLen",
};
const TIP_MAP = {
  "Düz Freze":"flat","Küre Freze":"ballnose","Radyus Freze":"bullnose","Pah Freze":"chamfer","Matkap":"drill","Kademeli Matkap":"stepdrill",
  "Düz (Flat)":"flat","Ball Nose":"ballnose","Radyuslu Freze":"bullnose","Pah (Chamfer)":"chamfer","Matkap (Drill)":"drill","Kademeli Matkap (Step)":"stepdrill",
  "flat":"flat","ballnose":"ballnose","bullnose":"bullnose","chamfer":"chamfer","drill":"drill","stepdrill":"stepdrill"};

/** Dosya baytlarından metin: BOM atılır; UTF-8 değilse Türkçe Excel kodlaması (Windows-1254). */
function csvMetniOku(buffer) {
  const bayt = new Uint8Array(buffer);
  const bomsuz = bayt[0] === 0xef && bayt[1] === 0xbb && bayt[2] === 0xbf ? bayt.subarray(3) : bayt;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bomsuz);
  } catch {
    return new TextDecoder("windows-1254").decode(bomsuz);
  }
}

/** Tırnak destekli satır/alan ayırıcı (RFC 4180: "a;b" ve "" kaçışı). */
function csvSatirlari(text, ayrac) {
  const satirlar = [];
  let satir = [], alan = "", tirnakta = false;
  const bitirAlan = () => { satir.push(alan); alan = ""; };
  const bitirSatir = () => { bitirAlan(); if (satir.some((a) => a.trim() !== "")) satirlar.push(satir); satir = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (tirnakta) {
      if (c === "\"") { if (text[i + 1] === "\"") { alan += "\""; i++; } else tirnakta = false; }
      else alan += c;
    } else if (c === "\"") tirnakta = true;
    else if (c === ayrac) bitirAlan();
    else if (c === "\n") bitirSatir();
    else if (c !== "\r") alan += c;
  }
  if (alan !== "" || satir.length) bitirSatir();
  return satirlar;
}

const TIP_KUCUK = Object.fromEntries(Object.entries(TIP_MAP).map(([k, v]) => [k.toLocaleLowerCase("tr"), v]));
TIP_KUCUK["radyüs freze"] = "bullnose";
TIP_KUCUK["radyus freze"] = "bullnose";

const sayiCoz = (s) => {
  const t = String(s ?? "").trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : NaN;
};

/**
 * CSV metnini takım listesine çevirir.
 * @returns {{ items: object[], uyarilar: string[] }}
 */
function csvOku(text) {
  const temiz = String(text).replace(/^\uFEFF/, "");
  const ilk = temiz.split(/\r?\n/, 1)[0] || "";
  const ayrac = [";", "\t", ","].map((a) => [a, ilk.split(a).length]).sort((x, y) => y[1] - x[1])[0][0];
  const satirlar = csvSatirlari(temiz, ayrac);
  if (satirlar.length < 2) return { items: [], uyarilar: [] };
  const headers = satirlar[0].map((h) => h.trim()).map((h) => CSV_HEADER_MAP[h] || h);
  const numFields = ["D","d","L","l1","l2","z","helix","dCore","neckDia","neckAngle","rCorner","chamferSize","pointAngle","coolantCount"];
  const boolFields = ["coolantHole"];
  const uyarilar = [];
  const items = satirlar.slice(1).map((ham, satirNo) => {
    const vals = ham.map((v) => v.trim());
    const obj = {};
    const ad = vals[headers.indexOf("toolName")] || `satır ${satirNo + 2}`;
    headers.forEach((h, i) => {
      if (h === "toolType") {
        const tip = TIP_KUCUK[(vals[i] || "").toLocaleLowerCase("tr")];
        if (!tip) uyarilar.push(`${ad}: bilinmeyen takım tipi "${vals[i] || ""}", Düz Freze alındı`);
        obj[h] = tip || "flat";
      } else if (numFields.includes(h)) {
        const v = sayiCoz(vals[i]);
        if (Number.isNaN(v)) uyarilar.push(`${ad}: "${vals[i]}" sayı değil (${h})`);
        obj[h] = v == null || Number.isNaN(v) ? 0 : v;
      } else if (boolFields.includes(h)) obj[h] = ["true", "1", "evet"].includes((vals[i] || "").toLocaleLowerCase("tr"));
      else obj[h] = vals[i] || "";
    });
    const steps = [];
    for (let s = 1; s <= 10; s++) {
      const diaIdx = headers.indexOf(`step${s}_dia`);
      if (diaIdx < 0) break;
      const dia = sayiCoz(vals[diaIdx]);
      if (!dia || dia <= 0) break;
      const al = (k) => vals[headers.indexOf(`step${s}_${k}`)] || "";
      steps.push({ dia, len: sayiCoz(al("len")) || 0, angle: sayiCoz(al("angle")) || 90, tolDia: al("tolDia"), tolLen: al("tolLen") });
    }
    if (steps.length > 0) obj.steps = steps;
    return { ...DEFAULT_PARAMS, ...obj };
  });
  items.forEach((t) => {
    for (const h of takimProfili(t).hatalar) uyarilar.push(`${t.toolName}: ${h.mesaj}`);
  });
  return { items, uyarilar };
}

function parseCSV(text) {
  return csvOku(text).items;
}

// Türkçe CSV şablon — tüm takım tipleri + örnekler
function generateCSVTemplate() {
  const cols = [
    "Takım Adı","Takım Tipi","Çap (D)","Sap Çapı (d)","Toplam Boy (L)",
    "Kesici Boy (l1)","Boğaz Boyu (l2)","Diş Sayısı","Helis Açısı","Çekirdek Çapı",
    "Malzeme","Kaplama","Boğaz Çapı","Geçiş Açısı","Köşe R","Pah Boyu",
    "Uç Açısı","Soğutma","Soğutma Adet","Tol D","Tol d","Tol l1",
    "KD1 Çap","KD1 Boy","KD1 Açı","KD1 Tol Çap","KD1 Tol Boy",
    "KD2 Çap","KD2 Boy","KD2 Açı","KD2 Tol Çap","KD2 Tol Boy",
    "KD3 Çap","KD3 Boy","KD3 Açı","KD3 Tol Çap","KD3 Tol Boy"
  ];
  const pad = (a) => { while(a.length < cols.length) a.push(""); return a; };
  const rows = [
    pad(["MHK-E10x75-4Z",        "Düz Freze",       "10","10","75", "25","0", "4","30","6", "Karbür","TiAlN","8.5","45","0","0","140","Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-E10x100-4Z-N",     "Düz Freze",       "10","10","100","30","12","4","30","6", "Karbür","TiAlN","8.5","45","0","0","140","Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-B8x60-2Z",         "Küre Freze",      "8", "8", "60", "20","0", "2","30","5", "Karbür","TiAlN","","",  "0","0","",   "Hayır","2","h6","h6","±0.1"]),
    pad(["MHK-R12x75-4Z-R1",     "Radyus Freze",    "12","12","75", "30","0", "4","35","7", "Karbür","TiAlN","","",  "1","0","",   "Hayır","2","±0.005","h5","±0.02"]),
    pad(["MHK-C10x60-4Z-P3",     "Pah Freze",       "10","10","60", "20","0", "4","30","6", "Karbür","TiAlN","","",  "0","3","",   "Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-D8x80-2Z",         "Matkap",          "8", "8", "80", "50","0", "2","30","4", "Karbür","TiAlN","","",  "0","0","140","Evet", "2","h6","h6","±0.1"]),
    pad(["MHK-SD10-14x90",       "Kademeli Matkap", "14","12","90", "30","0", "2","30","5", "Karbür","TiAlN","","",  "0","0","140","Hayır","2","","h6","", "10","15","140","±0.01","±0.01","14","15","90","±0.01","±0.01"]),
    pad(["MHK-SD12-16-20x90-3KD","Kademeli Matkap", "20","12","90", "45","0", "2","30","6", "Karbür","TiAlN","","",  "0","0","140","Hayır","2","","h6","", "12","15","140","±0.01","","16","15","90","±0.005","±0.01","20","15","90","±0.005","±0.01"]),
  ];
  return cols.join(";") + "\n" + rows.map(r => r.join(";")).join("\n") + "\n";
}

// İlk açılışta şablon verilerini yükle
function getInitialBatch() { return parseCSV(generateCSVTemplate()); }

export { CSV_HEADER_MAP, TIP_MAP, csvMetniOku, csvSatirlari, csvOku, parseCSV, generateCSVTemplate, getInitialBatch };
