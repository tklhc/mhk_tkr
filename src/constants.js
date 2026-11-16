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
  custom: "Özel Takım (Serbest Profil)",
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
  kademeOlcu: "kademe",   // kademeli matkap ölçüleri: "kademe" her kademenin boyu | "toplam" uçtan tek kesici boy (havşalı matkap)
  steps: [
    { dia: 10, len: 15, angle: 140, tolDia: "±0.01", tolLen: "±0.01" },
    { dia: 14, len: 15, angle: 90, tolDia: "±0.01", tolLen: "±0.01" },
  ],
  dCore: 6,
  profilNoktalari: [],  // özel takım: sap ucundan uca noktalar [{ x, dia }] (mm)
  ozelKesiciBas: 0,     // özel takım: kanallı bölümün başı (x, mm); 0 = otomatik
  salgi: "",            // salgı toleransı (kesici kenar, sap A datumuna göre), ör. "0,01"; boşsa çizilmez
  // Diş profili detayı (uçtan kesit): 0 = girilmedi. Kesme açısı γ, 1./2. serbest yüzey genişliği (mm) ve açısı (°)
  dpKesme: 0, dpSy1Gen: 0, dpSy1Aci: 0, dpSy2Gen: 0, dpSy2Aci: 0,
  coolantHole: false,
  coolantCount: 2,
  material: "Karbür",
  coating: "TiAlN",
  toolName: "MHK-E10x75-4Z",
  drawingNo: "",
  revision: "",
  revizyonlar: [],       // revizyon geçmişi: [{ rev, tarih, aciklama, kisi }] (onay akışı ekler)
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
  disProfili: true,     // diş profili detayı (yalnız iş emri çiziminde, verisi varsa)
  ekOzellikler: [],     // iş emrinden gelen çizilmeyen üretim özellikleri: [[ad, değer], ...]
  ekGoster: true,       // üretim özellikleri tablosu resimde görünsün
  sunum: true,          // sunum stili: gölgeli gövde + kaplama rengi (false: yalnız çizgi)
  // Sayfa
  kagit: "A4",           // A4 | A3
  olcek: "otomatik",     // otomatik | 2:1 | 1:1 | 1:2 ...
  dil: "tr",             // resim dili: tr | en (yalnız resim üzerindeki sabit yazılar)
  genelTolerans: "ISO 2768-m",
  tarih: "",             // boşsa bugün
  // Çizim türü & Onay damgası
  cizimTuru: "musteri", // "musteri": geniş antet, üretim verisi yok · "ie": dar antet + üretim özellikleri tablosu
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
