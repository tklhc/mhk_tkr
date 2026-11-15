const TOOL_TYPES = {
  flat: "Düz (Flat)",
  ballnose: "Ball Nose",
  bullnose: "Radyuslu Freze",
  chamfer: "Pah (Chamfer)",
  drill: "Matkap (Drill)",
  stepdrill: "Kademeli Matkap (Step)",
  reamer: "Rayba (Reamer)",
  taperreamer: "Konik Rayba",
  tslot: "T-Freze (T-Slot)",
};

// Takım tipine geçilirken uygulanan başlangıç değerleri (düzenlenebilir; standart değil)
export const TIP_VARSAYILAN = {
  reamer: (p) => ({ z: 6, helix: 0, chamferSize: p.chamferSize > 0 ? p.chamferSize : 0.5, l2: 0 }),
  taperreamer: (p) => ({ z: 6, helix: 0, l2: 0, tipD: Math.max(0.1, Math.round((p.D - p.l1 / 50) * 100) / 100) }), // 1:50 konik
  tslot: (p) => ({ z: Math.max(p.z || 0, 4), helix: 0, l1: 3, l2: 10, neckDia: Math.round(p.D * 0.5 * 10) / 10, neckAngle: 45 }),
};

const DEFAULT_PARAMS = {
  toolType: "flat",
  D: 10, tolD: "h6",
  d: 10, told: "h6",
  L: 75, tolL: "",
  l1: 25, toll1: "±0.05",
  l2: 0, toll2: "",
  neckDia: 8.5, tolNeck: "",
  neckAngle: 45,
  z: 4,
  helix: 30,
  helixHand: "Sağ",
  cutDir: "Sağ",
  rCorner: 0,
  chamferSize: 0,
  tipD: 0,              // konik rayba: uç çapı
  tolTip: "",
  sapTipi: "HA",        // HA düz | HB Weldon düzlüklü | HE Whistle Notch
  sapDuzUzunluk: 0,     // 0 = otomatik
  sapDuzDerinlik: 0,    // 0 = otomatik
  pointAngle: 140,
  steps: [
    { dia: 10, len: 15, angle: 140, tolDia: "±0.01", tolLen: "±0.01" },
    { dia: 14, len: 15, angle: 90, tolDia: "±0.01", tolLen: "±0.01" },
  ],
  dCore: 6,
  coolantHole: false,
  coolantCount: 2,
  material: "Karbür",
  coating: "TiAlN",
  toolName: "MHK-E10x75-4Z",
  drawingNo: "",
  revision: "",
  createdBy: "",
  approvedBy: "",
  // Show/hide toggles
  showDimD: true,
  showDimd: true,
  showDimL: true,
  showDiml1: true,
  showDiml2: true,
  showDimNeck: true,
  showDimHelix: true,
  showDimAngles: true,
  kesitAA: true,        // kesit görünüşü A-A
  detayA: true,         // büyütülmüş uç detayı
  // Sayfa
  kagit: "A4",           // A4 | A3
  olcek: "otomatik",     // otomatik | 2:1 | 1:1 | 1:2 ...
  genelTolerans: "ISO 2768-m",
  tarih: "",             // boşsa bugün
  // Müşteri modu & Onay damgası
  customerMode: false,  // müşteri modunda iç detaylar gizlenir
  stamp: "",            // "": yok, "ONAYLANDI", "TASLAK", "REVİZYON", "İPTAL"
  stampDate: "",        // damga tarihi
  // Notlar (baloncuk)
  notes: [],            // [{text, x, y}] — çizim üzerine not balonları
  // Müşteri & Sipariş
  customerName: "",
  orderNo: "",
  deliveryDate: "",
  // Colors
  colShank: "#c8ccd2",
  colNeck: "#b0b5bc",
  colCut: "#6088b0",
  colFlute: "#3a5a78",
  colTip: "#88aed0",
};

export { TOOL_TYPES, DEFAULT_PARAMS };
