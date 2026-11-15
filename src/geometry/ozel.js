// Özel takım: serbest profil. Kullanıcı sap ucundan (x = 0) takım ucuna doğru noktalar girer
// ({ x, dia }: eksen konumu mm, o noktadaki çap mm); noktalar arası doğrudur. Çap 0 yalnız uç noktada
// anlamlıdır (sivri uç). Aynı x'te iki nokta dikey basamak (çap değişimi) demektir.
//
// Türetilenler: L = son noktanın x'i, d = ilk noktanın çapı, D = en büyük çap.
// Kanallı (kesici) bölümün başı `ozelKesiciBas` ile verilir; 0 ise ilk sapın bittiği yerden sonra
// en büyük çapa ilk ulaşılan nokta kullanılır (yoksa sap bitişi, hepsi silindirse boyun %40'ı).

import { cizgi } from "./parcalar";

const EPS = 1e-9;
const sayi = (v, varsayilan = 0) => (Number.isFinite(+v) ? +v : varsayilan);

/** Girdiden temizlenmiş nokta listesi: [{ x, r }] (r yarıçap). Sayı olmayan satırlar atılır. */
export function ozelNoktalar(params) {
  const ham = Array.isArray(params.profilNoktalari) ? params.profilNoktalari : [];
  return ham.map((p) => ({ x: sayi(p?.x, NaN), r: sayi(p?.dia, NaN) / 2 })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.r));
}

/**
 * Özel takımın profili; `takimProfili` ile aynı biçimde döner.
 * @param {object} params
 */
export function ozelProfil(params) {
  const hatalar = [];
  const hata = (alan, mesaj) => hatalar.push({ alan, mesaj });
  const nk = ozelNoktalar(params);
  const bos = { tip: "custom", D: 0, d: 0, L: 0, l1: 0, l2: 0, nD: 0, gecisBoyu: 0, sapBoyu: 0, x: { sapSonu: 0, gecisSonu: 0, boyunSonu: 0, uc: 0 }, kademeler: [], kenarlar: [], ust: [], ustAlt: null, sapDuz: null, konik: null, hatalar, noktalar: nk };

  if (nk.length < 2) { hata("profil", "Özel profil için en az iki nokta gerekli (sap ucu ve takım ucu)."); return bos; }
  if (Math.abs(nk[0].x) > 1e-6) hata("profil", `İlk nokta sap ucu olmalı (x = 0); şu an ${nk[0].x}.`);
  for (let i = 1; i < nk.length; i++) {
    if (nk[i].x < nk[i - 1].x - EPS) hata("profil", `${i + 1}. noktanın x'i (${nk[i].x}) bir öncekinden (${nk[i - 1].x}) küçük; noktalar sap ucundan uca doğru sıralı olmalı.`);
    else if (Math.abs(nk[i].x - nk[i - 1].x) < EPS && Math.abs(nk[i].r - nk[i - 1].r) < EPS) hata("profil", `${i + 1}. nokta bir öncekiyle aynı.`);
  }
  nk.forEach((p, i) => {
    if (p.r < 0) hata("profil", `${i + 1}. noktanın çapı negatif olamaz.`);
    if (p.r === 0 && i < nk.length - 1) hata("profil", `${i + 1}. noktanın çapı 0: yalnız son nokta sivri uç olabilir.`);
  });
  if (!(nk[0].r > 0)) hata("d", "İlk noktanın çapı (sap çapı) sıfırdan büyük olmalı.");
  const L = nk[nk.length - 1].x;
  if (!(L > 0)) hata("L", "Takım boyu (son noktanın x'i) sıfırdan büyük olmalı.");

  const rmax = Math.max(...nk.map((p) => p.r), 0);
  const r0 = nk[0].r;
  // Sap bitişi: yarıçapın değişmeye başladığı nokta. Değişim yalnız uca yakınsa (ör. sadece uç pahı)
  // takım silindirik sayılır: sap ayrımı yok, kanallı bölüm boyun %40'ı.
  const idx = nk.findIndex((p) => Math.abs(p.r - r0) > EPS);
  const degisimX = idx > 0 ? nk[idx - 1].x : L;
  const silindirik = idx < 0 || degisimX > 0.8 * L;
  let boyunSonu = sayi(params.ozelKesiciBas);
  if (!(boyunSonu > 0)) {
    if (silindirik) boyunSonu = 0.6 * L;
    else {
      const adayi = nk.find((p) => p.x >= degisimX - EPS && p.r >= rmax - EPS);
      boyunSonu = adayi && adayi.x > EPS ? adayi.x : degisimX;
    }
  }
  const sapSonu = silindirik ? Math.min(Math.max(boyunSonu, 0), L) : degisimX;
  if (boyunSonu > L - EPS || boyunSonu < 0) hata("ozelKesiciBas", `Kesici bölüm başlangıcı (${boyunSonu}) takım boyu (${L}) içinde olmalı.`);
  const sinirli = Math.min(Math.max(boyunSonu, 0), L);

  // Kontur (üst yarı): eksenden ilk noktaya, noktalar arası, son noktadan eksene
  const ust = [cizgi(0, 0, 0, r0)];
  for (let i = 0; i < nk.length - 1; i++) {
    const a = nk[i], b = nk[i + 1];
    if (Math.hypot(b.x - a.x, b.r - a.r) > EPS) ust.push(cizgi(a.x, a.r, b.x, b.r));
  }
  const son = nk[nk.length - 1];
  if (son.r > EPS) ust.push(cizgi(son.x, son.r, son.x, 0));

  // Görünür kenarlar: eğim ya da çap değiştiği her iç köşede dikey çizgi
  const kenarlar = [];
  const yon = (a, b) => (Math.abs(b.x - a.x) < EPS ? (Math.abs(b.r - a.r) < EPS ? "yok" : "dikey") : Math.atan2(b.r - a.r, b.x - a.x).toFixed(6));
  for (let i = 1; i < nk.length - 1; i++) {
    const p = nk[i];
    if (p.x <= EPS || p.x >= L - EPS) continue;
    if (yon(nk[i - 1], p) !== yon(p, nk[i + 1])) {
      const r = Math.max(p.r, nk[i - 1].x === p.x ? nk[i - 1].r : 0, nk[i + 1].x === p.x ? nk[i + 1].r : 0);
      if (r > EPS && !kenarlar.some((k) => Math.abs(k.x - p.x) < 1e-6)) kenarlar.push({ x: p.x, r });
    }
  }
  kenarlar.sort((a, b) => a.x - b.x);

  const D = 2 * rmax, d = 2 * r0;
  return {
    tip: "custom", D, d, L, l1: Math.max(L - sinirli, 0), l2: 0, nD: D, gecisBoyu: 0, sapBoyu: sapSonu,
    x: { sapSonu, gecisSonu: sinirli, boyunSonu: sinirli, uc: L },
    kademeler: [], kenarlar, ust, ustAlt: null, sapDuz: null, konik: null, hatalar, noktalar: nk,
  };
}
