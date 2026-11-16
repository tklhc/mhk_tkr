// Takım geometrisinin tek kaynağı.
//
// Koordinatlar mm cinsindendir: x ekseni takım ekseni boyunca sap ucundan (x = 0)
// takım ucuna (x = L) gider, y ekseni yarıçaptır (yukarı pozitif).
// Yan görünüş, DXF ve 3D bu modülün çıktısını kullanır; ölçüler de buradaki
// istasyonlara (x değerlerine) bağlanır.
//
// Kontur parçaları:
//   { t: "L", x1, y1, x2, y2 }                    doğru
//   { t: "A", cx, cy, r, a1, a2 }                  yay (açılar derece; a1'den a2'ye)

import { ozelProfil } from "./ozel";

const DEG = Math.PI / 180;
const EPS = 1e-9;

const sayi = (v, varsayilan = 0) => (Number.isFinite(+v) ? +v : varsayilan);

function cizgi(x1, y1, x2, y2) {
  return { t: "L", x1, y1, x2, y2 };
}

function yay(cx, cy, r, a1, a2) {
  return { t: "A", cx, cy, r, a1, a2 };
}

function yayUclari(s) {
  return {
    x1: s.cx + s.r * Math.cos(s.a1 * DEG), y1: s.cy + s.r * Math.sin(s.a1 * DEG),
    x2: s.cx + s.r * Math.cos(s.a2 * DEG), y2: s.cy + s.r * Math.sin(s.a2 * DEG),
  };
}

/** Bir parçanın başlangıç ve bitiş noktası. */
export function parcaUclari(s) {
  return s.t === "A" ? yayUclari(s) : { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
}

/**
 * Takım parametrelerinden geometriyi hesaplar.
 * @returns {{
 *   tip: string, D: number, d: number, L: number, l1: number, l2: number,
 *   nD: number, gecisBoyu: number, sapBoyu: number,
 *   x: { sapSonu: number, gecisSonu: number, boyunSonu: number, uc: number },
 *   kademeler: Array<{ dia: number, len: number, angle: number, sol: number, sag: number, gecisBoyu: number }>,
 *   ust: Array<object>, hatalar: Array<{ alan: string, mesaj: string }>
 * }}
 */
export function takimProfili(params) {
  const tip = params.toolType || "flat";
  if (tip === "custom") return ozelProfil(params);
  let D = sayi(params.D);
  const d = sayi(params.d);
  const L = sayi(params.L);
  let l1 = sayi(params.l1);
  let l2 = sayi(params.l2);
  const neckDia = sayi(params.neckDia);
  const neckAngle = sayi(params.neckAngle, 45);
  const rCorner = sayi(params.rCorner);
  const chamferSize = sayi(params.chamferSize);
  const tipD = sayi(params.tipD);
  const pointAngle = sayi(params.pointAngle, 140) || 140;
  const dCore = sayi(params.dCore);
  const hatalar = [];
  const hata = (alan, mesaj) => hatalar.push({ alan, mesaj });

  // Kademeli matkapta kesici boy ve en büyük çap kademelerden gelir, boğaz yoktur.
  const kademeGirdi = tip === "stepdrill" ? (params.steps || []) : [];
  if (tip === "stepdrill") {
    l1 = kademeGirdi.reduce((t, k) => t + (sayi(k.len) || 0), 0);
    l2 = 0;
    D = kademeGirdi.length > 0 ? Math.max(...kademeGirdi.map((k) => sayi(k.dia))) : D;
  }

  const nD = l2 > 0 ? neckDia : D;
  const gecisBoyu = l2 > 0 && d > nD ? ((d - nD) / 2) / Math.tan(neckAngle * DEG) : 0;
  const sapBoyu = L - l1 - l2 - gecisBoyu;

  const sapSonu = Math.max(sapBoyu, 0);
  const gecisSonu = sapSonu + gecisBoyu;
  const boyunSonu = gecisSonu + l2;
  const x = { sapSonu, gecisSonu, boyunSonu, uc: L };

  // Görünür kenar çizgileri: yan görünüşte çap değişiminin ya da koni
  // başlangıcının oluşturduğu dikey çizgi (x konumunda, ±r yüksekliğinde).
  const kenarlar = [];
  const kenar = (kx, r) => {
    if (kx > EPS && kx < L - EPS && r > EPS && !kenarlar.some((k) => Math.abs(k.x - kx) < 1e-6)) kenarlar.push({ x: kx, r });
  };

  // ── Doğrulama ──
  if (!(D > 0)) hata("D", "Kesici çap (D) sıfırdan büyük olmalı.");
  if (!(d > 0)) hata("d", "Sap çapı (d) sıfırdan büyük olmalı.");
  if (!(L > 0)) hata("L", "Toplam boy (L) sıfırdan büyük olmalı.");
  if (L > 0 && sapBoyu <= 0) {
    hata("L", `Sap kalmıyor: kesici boy + boğaz boyu${gecisBoyu > 0 ? " + geçiş" : ""} (${(L - sapBoyu).toFixed(2)} mm) toplam boydan (${L} mm) uzun ya da eşit.`);
  }
  if (l2 > 0 && neckDia <= 0) hata("neckDia", "Boğaz çapı sıfırdan büyük olmalı.");
  if (l2 > 0 && neckDia > d) hata("neckDia", `Boğaz çapı (${neckDia}) sap çapından (${d}) büyük olamaz.`);
  if (l2 > 0 && neckDia > D) hata("neckDia", `Boğaz çapı (${neckDia}) kesici çaptan (${D}) büyük olamaz.`);
  if (l2 > 0 && d > nD && !(neckAngle > 0 && neckAngle < 90)) hata("neckAngle", "Geçiş açısı 0° ile 90° arasında olmalı.");
  if (dCore > 0 && dCore >= D) hata("dCore", `Çekirdek çapı (${dCore}) kesici çaptan (${D}) küçük olmalı.`);
  if (tip === "bullnose" && rCorner > D / 2) hata("rCorner", `Köşe radyüsü (${rCorner}) çapın yarısından (${D / 2}) büyük olamaz.`);
  if ((tip === "chamfer" || tip === "reamer" || tip === "flat") && chamferSize > D / 2) hata("chamferSize", `Pah boyu (${chamferSize}) çapın yarısından (${D / 2}) büyük olamaz.`);
  if (tip === "taperreamer") {
    if (!(tipD > 0)) hata("tipD", "Konik rayba için uç çapı (tipD) girilmeli.");
    else if (tipD >= D) hata("tipD", `Uç çapı (${tipD}) büyük uç çapından (${D}) küçük olmalı.`);
  }
  if (tip === "ballnose" && D / 2 > l1) hata("l1", `Küre frezede kesici boy (${l1}) yarıçaptan (${D / 2}) kısa olamaz.`);
  if (tip === "drill" && !(pointAngle > 0 && pointAngle < 180)) hata("pointAngle", "Uç açısı 0° ile 180° arasında olmalı.");

  // ── Üst yarı kontur (x = 0'dan x = L'ye) ──
  const hd = d / 2, hN = nD / 2, hD = D / 2;
  if (l2 > 0) {
    kenar(sapSonu, gecisBoyu > 0 ? hd : Math.min(hd, hN));
    if (gecisBoyu > 0) kenar(gecisSonu, hN);
    kenar(boyunSonu, Math.min(hN, hD));
  } else {
    kenar(sapSonu, Math.min(hd, hD));
  }
  // Sap detayı: DIN 6535 HB (Weldon düzlüğü) ve HE (Whistle Notch, eğimli düzlük).
  // Düzlük sapın serbest ucunda, üst yarıda çizilir; alt yarı tam daire kalır.
  // Uzunluk/derinlik girilmezse yaklaşık otomatik değer alınır (standart tablosu DEĞİL).
  const sapDuzu = () => {
    const sapTipi = params.sapTipi === "HB" || params.sapTipi === "HE" ? params.sapTipi : "HA";
    if (sapTipi === "HA" || !(sapBoyu > 0)) return null;
    let uzunluk = sayi(params.sapDuzUzunluk), derinlik = sayi(params.sapDuzDerinlik);
    const oto = { uzunluk: !(uzunluk > 0), derinlik: !(derinlik > 0) };
    if (oto.uzunluk) uzunluk = Math.min(2 * d, 0.7 * sapBoyu);
    if (oto.derinlik) derinlik = 0.1 * d;
    const rampa = sapTipi === "HB" ? derinlik : 0; // HB düzlüğünün çıkış rampası 45°
    if (derinlik >= hd) hata("sapDuzDerinlik", `Düzlük derinliği (${derinlik}) sap yarıçapından (${hd}) küçük olmalı.`);
    if (uzunluk + rampa > sapBoyu - 1e-9) hata("sapDuzUzunluk", `Düzlük (${(uzunluk + rampa).toFixed(2)} mm) sap boyuna (${sapBoyu.toFixed(2)} mm) sığmıyor.`);
    return { tip: sapTipi, uzunluk, derinlik, rampa, oto };
  };
  const duzUygula = (ust, duz) => {
    const { uzunluk: uz, derinlik: t, rampa } = duz;
    const yeni = duz.tip === "HB"
      ? [cizgi(0, 0, 0, hd - t), cizgi(0, hd - t, uz, hd - t), cizgi(uz, hd - t, uz + rampa, hd), cizgi(uz + rampa, hd, sapSonu, hd)]
      : [cizgi(0, 0, 0, hd - t), cizgi(0, hd - t, uz, hd), cizgi(uz, hd, sapSonu, hd)];
    return [...yeni, ...ust.slice(2)];
  };
  const sonuc = (ust) => {
    kenarlar.sort((a, b) => a.x - b.x);
    const sonuc = { tip, D, d, L, l1, l2, nD, gecisBoyu, sapBoyu, x, kademeler, kenarlar, ust, ustAlt: null, sapDuz: null, konik: null, hatalar };
    const duz = sapDuzu();
    if (duz) { sonuc.ustAlt = ust; sonuc.ust = duzUygula(ust, duz); sonuc.sapDuz = duz; }
    return sonuc;
  };
  const ust = [];
  ust.push(cizgi(0, 0, 0, hd));
  if (sapBoyu > 0) ust.push(cizgi(0, hd, sapSonu, hd));

  if (l2 > 0) {
    if (gecisBoyu > 0) ust.push(cizgi(sapSonu, hd, gecisSonu, hN));
    else if (Math.abs(hd - hN) > EPS) ust.push(cizgi(sapSonu, hd, sapSonu, hN));
    ust.push(cizgi(gecisSonu, hN, boyunSonu, hN));
    if (Math.abs(hN - hD) > EPS && tip !== "stepdrill") ust.push(cizgi(boyunSonu, hN, boyunSonu, hD));
  }

  const k0 = boyunSonu; // kesici bölümün başlangıcı
  let konikOran = 0;
  const kademeler = [];
  // Sap/boğaz sonu ile kesici başlangıcındaki yarıçap (basamak çizgisi için)
  const oncekiY = l2 > 0 ? hN : hd;

  if (tip === "stepdrill" && kademeGirdi.length > 0) {
    // Kademe 0 (en küçük) uçta; sola doğru büyür. Her kademe kendi boyunun
    // sağ ucunda, önceki kademeye açılı geçişle bağlanır.
    let sag = L;
    let oncekiR = 0;
    // "toplam" ölçü (havşalı matkap): 1. kademenin boyu uç konisi bittiği yerden sayılır, boyların toplamı
    // (helis boyu) uçtan ölçülür. Çizimde 1. kademe koni kadar uzar, 2. kademe aynı kadar kısalır; toplam değişmez.
    const toplam = params.kademeOlcu === "toplam";
    const aci0 = sayi(kademeGirdi[0].angle, 140) || 140;
    const koni0 = toplam ? sayi(kademeGirdi[0].dia) / 2 / Math.tan((aci0 / 2) * DEG) : 0;
    kademeGirdi.forEach((k, i) => {
      const dia = sayi(k.dia), boy = sayi(k.len);
      const len = toplam ? boy + (i === 0 ? koni0 : i === 1 ? -koni0 : 0) : boy;   // çizimdeki uçtan boy
      const angle = sayi(k.angle, i === 0 ? 140 : 90) || (i === 0 ? 140 : 90);
      const r = dia / 2;
      const gecis = i === 0 ? r / Math.tan((angle / 2) * DEG) : (r - oncekiR) / Math.tan((angle / 2) * DEG);
      kademeler.push({ dia, len, boy, angle, sol: sag - len, sag, gecisBoyu: gecis, tolDia: k.tolDia || "", tolLen: k.tolLen || "" });
      if (i > 0 && dia <= sayi(kademeGirdi[i - 1].dia)) hata(`steps.${i}.dia`, `Kademe ${i + 1} çapı (${dia}) bir önceki kademeden (${sayi(kademeGirdi[i - 1].dia)}) büyük olmalı.`);
      if (!(boy > 0)) hata(`steps.${i}.len`, `Kademe ${i + 1} boyu sıfırdan büyük olmalı.`);
      else if (gecis > len) hata(`steps.${i}.len`, `Kademe ${i + 1} boyu (${len}) açılı geçişten (${gecis.toFixed(2)}) kısa.`);
      sag -= len;
      oncekiR = r;
    });
    // Soldan sağa: en büyük kademeden uca
    const son = kademeler[kademeler.length - 1];
    if (Math.abs(oncekiY - son.dia / 2) > EPS) ust.push(cizgi(k0, oncekiY, k0, son.dia / 2));
    for (let i = kademeler.length - 1; i >= 0; i--) {
      const k = kademeler[i];
      const r = k.dia / 2;
      const hedefR = i === 0 ? 0 : kademeler[i - 1].dia / 2;
      ust.push(cizgi(k.sol, r, k.sag - k.gecisBoyu, r));
      ust.push(cizgi(k.sag - k.gecisBoyu, r, k.sag, hedefR));
      kenar(k.sag - k.gecisBoyu, r);
      if (i > 0) kenar(k.sag, hedefR);
    }
    return sonuc(ust);
  }

  if (l2 === 0 && Math.abs(hd - hD) > EPS) ust.push(cizgi(sapSonu, hd, sapSonu, hD));

  if (tip === "drill") {
    const ucBoyu = hD / Math.tan((pointAngle / 2) * DEG);
    ust.push(cizgi(k0, hD, L - ucBoyu, hD));
    ust.push(cizgi(L - ucBoyu, hD, L, 0));
    kenar(L - ucBoyu, hD);
  } else if (tip === "ballnose") {
    ust.push(cizgi(k0, hD, L - hD, hD));
    ust.push(yay(L - hD, 0, hD, 90, 0));
  } else if (tip === "bullnose" && rCorner > 0) {
    ust.push(cizgi(k0, hD, L - rCorner, hD));
    ust.push(yay(L - rCorner, hD - rCorner, rCorner, 90, 0));
    ust.push(cizgi(L, hD - rCorner, L, 0));
  } else if (tip === "taperreamer" && tipD > 0 && tipD < D) {
    ust.push(cizgi(k0, hD, L, tipD / 2));
    ust.push(cizgi(L, tipD / 2, L, 0));
    kenar(k0, hD);
    konikOran = l1 > 0 ? (D - tipD) / l1 : 0;
  } else if ((tip === "chamfer" || tip === "reamer" || tip === "flat") && chamferSize > 0) {
    ust.push(cizgi(k0, hD, L - chamferSize, hD));
    ust.push(cizgi(L - chamferSize, hD, L, hD - chamferSize));
    ust.push(cizgi(L, hD - chamferSize, L, 0));
    kenar(L - chamferSize, hD);
  } else {
    ust.push(cizgi(k0, hD, L, hD));
    ust.push(cizgi(L, hD, L, 0));
  }

  const sonucu = sonuc(ust);
  if (konikOran > 0) sonucu.konik = { oran: konikOran, bolen: 1 / konikOran };
  return sonucu;
}

/** Bir parçanın x eksenine göre aynası (alt yarı için). */
function aynala(s) {
  if (s.t === "A") return yay(s.cx, -s.cy, s.r, -s.a2, -s.a1);
  return cizgi(s.x2, -s.y2, s.x1, -s.y1);
}

/**
 * Kapalı dış kontur: üst yarı soldan sağa, alt yarı sağdan sola.
 * Eksen üzerindeki sıfır boylu parçalar atlanır.
 */
export function tamKontur(profil) {
  const uzun = (s) => s.t === "A" || Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > EPS;
  const ust = profil.ust.filter(uzun);
  const alt = [...(profil.ustAlt || profil.ust).filter(uzun)].reverse().map(aynala);
  return [...ust, ...alt];
}

/** Parçayı SVG path komutuna çevirir (x, y dönüşümü dışarıdan verilir). */
export function svgYolu(parcalar, donustur) {
  let d = "";
  let son = null;
  for (const s of parcalar) {
    const u = parcaUclari(s);
    const [ax, ay] = donustur(u.x1, u.y1);
    const [bx, by] = donustur(u.x2, u.y2);
    if (!son || Math.hypot(son[0] - ax, son[1] - ay) > 1e-6) d += `M ${ax} ${ay} `;
    if (s.t === "A") {
      const [rx] = donustur(s.r, 0);
      const [r0] = donustur(0, 0);
      const rr = Math.abs(rx - r0);
      const buyuk = Math.abs(s.a2 - s.a1) > 180 ? 1 : 0;
      // y ekseni ekranda ters döndüğü için yön de ters döner
      const yon = s.a2 < s.a1 ? 1 : 0;
      d += `A ${rr} ${rr} 0 ${buyuk} ${yon} ${bx} ${by} `;
    } else {
      d += `L ${bx} ${by} `;
    }
    son = [bx, by];
  }
  return d.trim();
}

/**
 * Takım eksenindeki x konumunda (mm) dış yarıçap. Basamak (dikey kenar) konumunda
 * büyük olan değeri verir. Konturun dışında 0.
 */
export function yaricapAt(profil, x) {
  let m = 0;
  for (const s of profil.ust) {
    const u = parcaUclari(s);
    const lo = Math.min(u.x1, u.x2), hi = Math.max(u.x1, u.x2);
    if (x < lo - EPS || x > hi + EPS) continue;
    if (s.t === "A") {
      m = Math.max(m, s.cy + Math.sqrt(Math.max(0, s.r * s.r - (x - s.cx) ** 2)));
    } else if (hi - lo < EPS) {
      m = Math.max(m, u.y1, u.y2);
    } else {
      m = Math.max(m, u.y1 + ((x - u.x1) / (u.x2 - u.x1)) * (u.y2 - u.y1));
    }
  }
  return m;
}

/** Yayı, 3D ve benzeri çıktılar için (x, r) noktalarına böler; doğru parçası 2 nokta verir. */
export function parcaNoktalari(s, adim = 12) {
  if (s.t !== "A") return [[s.x1, s.y1], [s.x2, s.y2]];
  const pts = [];
  for (let i = 0; i <= adim; i++) {
    const a = (s.a1 + ((s.a2 - s.a1) * i) / adim) * DEG;
    pts.push([s.cx + s.r * Math.cos(a), s.cy + s.r * Math.sin(a)]);
  }
  return pts;
}
