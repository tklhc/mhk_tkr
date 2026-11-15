import { DEFAULT_PARAMS } from "../constants";

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
  "KD1 Çap":"step1_dia","KD1 Boy":"step1_len","KD1 Açı":"step1_angle","KD1 Tol Çap":"step1_tolDia","KD1 Tol Boy":"step1_tolLen",
  "KD2 Çap":"step2_dia","KD2 Boy":"step2_len","KD2 Açı":"step2_angle","KD2 Tol Çap":"step2_tolDia","KD2 Tol Boy":"step2_tolLen",
  "KD3 Çap":"step3_dia","KD3 Boy":"step3_len","KD3 Açı":"step3_angle","KD3 Tol Çap":"step3_tolDia","KD3 Tol Boy":"step3_tolLen",
};
const TIP_MAP = {
  "Düz Freze":"flat","Küre Freze":"ballnose","Radyus Freze":"bullnose","Pah Freze":"chamfer","Matkap":"drill","Kademeli Matkap":"stepdrill",
  "Düz (Flat)":"flat","Ball Nose":"ballnose","Radyuslu Freze":"bullnose","Pah (Chamfer)":"chamfer","Matkap (Drill)":"drill","Kademeli Matkap (Step)":"stepdrill",
  "flat":"flat","ballnose":"ballnose","bullnose":"bullnose","chamfer":"chamfer","drill":"drill","stepdrill":"stepdrill"};

function parseCSV(text) {
  const sep = text.indexOf(";") > -1 ? ";" : ",";
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rawHeaders = lines[0].split(sep).map(h => h.trim());
  const headers = rawHeaders.map(h => CSV_HEADER_MAP[h] || h);
  const numFields = ["D","d","L","l1","l2","z","helix","dCore","neckDia","neckAngle","rCorner","chamferSize","pointAngle","coolantCount","bbWidth","bbCol1","bbCol2"];
  const boolFields = ["coolantHole"];
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(sep).map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      if (h === "toolType") obj[h] = TIP_MAP[vals[i]] || vals[i] || "flat";
      else if (numFields.includes(h)) obj[h] = parseFloat(vals[i]) || 0;
      else if (boolFields.includes(h)) obj[h] = vals[i] === "true" || vals[i] === "1" || vals[i] === "Evet";
      else obj[h] = vals[i] || "";
    });
    const steps = [];
    for (let s = 1; s <= 10; s++) {
      const diaIdx = headers.indexOf(`step${s}_dia`);
      if (diaIdx < 0) break;
      const dia = parseFloat(vals[diaIdx]);
      if (!dia || dia <= 0) break;
      steps.push({
        dia, len: parseFloat(vals[headers.indexOf(`step${s}_len`)]||0)||0,
        angle: parseFloat(vals[headers.indexOf(`step${s}_angle`)]||0)||90,
        tolDia: vals[headers.indexOf(`step${s}_tolDia`)]||"",
        tolLen: vals[headers.indexOf(`step${s}_tolLen`)]||"",
      });
    }
    if (steps.length > 0) obj.steps = steps;
    return { ...DEFAULT_PARAMS, ...obj };
  });
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

export { CSV_HEADER_MAP, TIP_MAP, parseCSV, generateCSVTemplate, getInitialBatch };
