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
  kesitAA: false,       // kesit görünüşü A-A (şematik; açık değilse çizilmez)
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
