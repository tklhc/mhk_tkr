// Takım tipi değiştirilirken uygulanan ön ayarlar.
//
// Tip değişince önceki tipe ait geometri (boğaz, köşe radyüsü, pah, uç çapı...) SIFIRLANIR,
// yeni tipin makul başlangıç değerleri yazılır. Korunanlar: ana ölçüler (D, d, L) ve
// toleransları, belge/antet bilgileri, sap tipi, soğutma, "resimde göster" seçimleri.
// Değerler başlangıç önerisidir (standart değil); kullanıcı hepsini düzenleyebilir.

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

/** Tüm tiplerde önce sıfırlanan geometri alanları */
function temelSifir(p) {
  return {
    l2: 0, toll2: "",
    neckDia: r1(Math.min(p.D * 0.85, p.d * 0.9)), neckAngle: 45, tolNeck: "",
    rCorner: 0, chamferSize: 0,
    tipD: 0, tolTip: "",
    pointAngle: 140,
  };
}

/** Tipe özel değerler. D, d, L geçerli (sayı) varsayılır. */
const TIP_ON_AYAR = {
  flat: (p, kes) => ({ z: 4, helix: 30, dCore: r1(p.D * 0.6), l1: kes(2.5) }),
  ballnose: (p, kes) => ({ z: 2, helix: 30, dCore: r1(p.D * 0.5), l1: Math.max(kes(2), r1(p.D * 0.6)) }),
  bullnose: (p, kes) => ({ z: 4, helix: 30, dCore: r1(p.D * 0.6), l1: kes(2.5), rCorner: Math.max(0.1, r1(p.D * 0.1)) }),
  chamfer: (p, kes) => ({ z: 4, helix: 30, dCore: r1(p.D * 0.6), l1: kes(2), chamferSize: r1(p.D * 0.3) }),
  drill: (p, kes) => ({ z: 2, helix: 30, dCore: r1(p.D * 0.3), l1: kes(6), pointAngle: 140 }),
  stepdrill: (p) => {
    const boy = Math.max(1, r1(Math.min(p.D * 1.5, p.L * 0.25)));
    return {
      z: 2, helix: 30, dCore: r1(p.D * 0.3),
      steps: [
        { dia: p.D, len: boy, angle: 140, tolDia: "", tolLen: "" },
        { dia: r1(p.D * 1.4), len: boy, angle: 90, tolDia: "", tolLen: "" },
      ],
    };
  },
  reamer: (p, kes) => ({ z: 6, helix: 0, dCore: r1(p.D * 0.7), l1: kes(4), chamferSize: Math.min(0.5, r1(p.D * 0.1) || 0.1) }),
  taperreamer: (p, kes) => {
    const l1 = kes(4);
    return { z: 6, helix: 0, dCore: r1(p.D * 0.7), l1, tipD: Math.max(0.1, r2(p.D - l1 / 50)) }; // 1:50
  },
  tslot: (p) => ({ z: 4, helix: 0, dCore: r1(p.D * 0.6), l1: 3, l2: 10, neckDia: r1(Math.min(p.D * 0.5, p.d * 0.8)), neckAngle: 45 }),
};

/**
 * Takım tipini değiştirir ve geometriyi yeni tipin ön ayarına getirir.
 * Aynı tipe geçiş parametreleri değiştirmez.
 */
export function tipDegistir(p, yeniTip) {
  if (p.toolType === yeniTip || !TIP_ON_AYAR[yeniTip]) return { ...p, toolType: yeniTip };
  const D = Number(p.D) > 0 ? Number(p.D) : 10;
  const d = Number(p.d) > 0 ? Number(p.d) : D;
  const L = Number(p.L) > 0 ? Number(p.L) : 75;
  const taban = { ...p, D, d, L };
  // Kesici boy en çok toplam boyun %60'ı (sap kalsın)
  const kes = (oran) => Math.max(1, Math.min(r1(oran * D), r1(L * 0.6)));
  return { ...p, toolType: yeniTip, ...temelSifir(taban), ...TIP_ON_AYAR[yeniTip](taban, kes) };
}

export const TIP_LISTESI = Object.keys(TIP_ON_AYAR);
