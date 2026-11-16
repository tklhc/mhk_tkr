// ─── EXCEL EXPORT (HTML tablo → .xls — Türkçe uyumlu) ──
function toExcelHtml(headers, rows, title) {
  const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let h = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>td,th{border:1px solid #999;padding:4px 8px;font-family:Calibri,Arial;font-size:11pt;mso-number-format:'\\@';}
th{background:#2a5a8a;color:#fff;font-weight:bold;text-align:center;}
tr:nth-child(even) td{background:#eef2f7;}</style></head><body>`;
  if (title) h += `<h2 style="font-family:Calibri;color:#1a3a5a;">${esc(title)}</h2>`;
  h += `<table><tr>${headers.map(c => `<th>${esc(c)}</th>`).join("")}</tr>`;
  rows.forEach(r => { h += `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`; });
  h += `</table></body></html>`;
  return h;
}

function downloadExcel(html, filename) {
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function generateTemplateExcel() {
  const headers = [
    "Takım Adı","Takım Tipi","Çap (D)","Sap Çapı (d)","Toplam Boy (L)",
    "Kesici Boy (l1)","Boğaz Boyu (l2)","Diş Sayısı","Helis Açısı","Çekirdek Çapı",
    "Malzeme","Kaplama","Boğaz Çapı","Geçiş Açısı","Köşe R","Pah Boyu",
    "Uç Açısı","Soğutma","Soğutma Adet","Tol D","Tol d","Tol l1",
    "KD1 Çap","KD1 Boy","KD1 Açı","KD1 Tol Çap","KD1 Tol Boy",
    "KD2 Çap","KD2 Boy","KD2 Açı","KD2 Tol Çap","KD2 Tol Boy",
    "KD3 Çap","KD3 Boy","KD3 Açı","KD3 Tol Çap","KD3 Tol Boy"
  ];
  const pad = (a) => { while(a.length < headers.length) a.push(""); return a; };
  const rows = [
    pad(["MHK-E10x75-4Z","Düz Freze","10","10","75","25","0","4","30","6","Karbür","TiAlN","8.5","45","0","0","140","Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-E10x100-4Z-N","Düz Freze","10","10","100","30","12","4","30","6","Karbür","TiAlN","8.5","45","0","0","140","Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-B8x60-2Z","Küre Freze","8","8","60","20","0","2","30","5","Karbür","TiAlN","","","0","0","","Hayır","2","h6","h6","±0.1"]),
    pad(["MHK-R12x75-4Z-R1","Radyüs Freze","12","12","75","30","0","4","35","7","Karbür","TiAlN","","","1","0","","Hayır","2","±0.005","h5","±0.02"]),
    pad(["MHK-C10x60-4Z-P3","Pah Freze","10","10","60","20","0","4","30","6","Karbür","TiAlN","","","0","3","","Hayır","2","h6","h6","±0.05"]),
    pad(["MHK-D8x80-2Z","Matkap","8","8","80","50","0","2","30","4","Karbür","TiAlN","","","0","0","140","Evet","2","h6","h6","±0.1"]),
    pad(["MHK-SD10-14x90","Kademeli Matkap","14","12","90","30","0","2","30","5","Karbür","TiAlN","","","0","0","140","Hayır","2","","h6","","10","15","140","±0.01","±0.01","14","15","90","±0.01","±0.01"]),
    pad(["MHK-SD12-16-20x90-3KD","Kademeli Matkap","20","12","90","45","0","2","30","6","Karbür","TiAlN","","","0","0","140","Hayır","2","","h6","","12","15","140","±0.01","","16","15","90","±0.005","±0.01","20","15","90","±0.005","±0.01"]),
  ];
  return toExcelHtml(headers, rows, "MİHENK Kesici Takımlar — Şablon");
}

function generateExcelReport(batch, lib) {
  const items = batch.length > 1 ? batch : lib.length > 0 ? lib : [];
  if (items.length === 0) return null;
  const headers = [
    "Takım Adı","Takım Tipi","Çap (D)","Sap Çapı (d)","Toplam Boy (L)","Kesici Boy (l1)",
    "Boğaz Boyu (l2)","Diş Sayısı","Helis Açısı","Çekirdek Çapı","Malzeme","Kaplama",
    "Boğaz Çapı","Geçiş Açısı","Köşe R","Pah Boyu","Uç Açısı","Soğutma","Soğutma Adet",
    "Tol D","Tol d","Tol l1","Müşteri","Sipariş No","Teslim Tarihi","Onay","Revizyon","Kayıt Tarihi"
  ];
  const tipNames = {flat:"Düz Freze",ballnose:"Küre Freze",bullnose:"Radyüs Freze",chamfer:"Pah Freze",drill:"Matkap",stepdrill:"Kademeli Matkap"};
  const rows = items.map(p => [
    p.toolName||"", tipNames[p.toolType]||p.toolType||"",
    p.D||"", p.d||"", p.L||"", p.l1||"", p.l2||"",
    p.z||"", p.helix||"", p.dCore||"", p.material||"", p.coating||"",
    p.neckDia||"", p.neckAngle||"", p.rCorner||"", p.chamferSize||"", p.pointAngle||"",
    p.coolantHole?"Evet":"Hayır", p.coolantCount||"",
    p.tolD||"", p.told||"", p.toll1||"",
    p.customerName||"", p.orderNo||"", p.deliveryDate||"",
    p.stamp||"", p.revision||"", p.savedAt||""
  ]);
  return toExcelHtml(headers, rows, "MİHENK Kesici Takımlar — Rapor (" + new Date().toLocaleDateString("tr-TR") + ")");
}

export { toExcelHtml, downloadExcel, generateTemplateExcel, generateExcelReport };
