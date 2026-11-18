import { DEFAULT_PARAMS } from "../constants";

// Takım yükleme ve dosya olarak kaydetme/açma. Yeni bir takım yüklenirken önceki resmin
// kalıntıları (notlar, damga, üretim özellikleri, sürüklenmiş konumlar) taşınmaz.

/** Takım değişse de kullanıcının seçili kalmasını beklediği sayfa tercihleri. */
export const TERCIHLER = ["dil", "kagit", "olcek", "sunum", "cizimTuru", "genelTolerans", "createdBy", "kesitAA", "detayA", "ucGorunus", "showUcKonisi",
  "showDimD", "showDimd", "showDimL", "showDiml1", "showDiml2", "showDimNeck", "showDimHelix", "showDimAngles"];

/** Derin kopya: kayıtlar ve varsayılanlar paylaşılan nesneleri (steps, notes…) değiştirmesin. */
const kopya = (v) => (v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v);

/**
 * Tam bir kayıt (kütüphane, dosya): kayıtta olmayan her alan varsayılana döner;
 * önceki resimden hiçbir şey kalmaz. Konumlar (dimOff) kayıttan gelir, yoksa boş.
 */
export function kayittanYukle(kayit) {
  const { dimOff, savedAt, ...p } = kayit || {};
  void savedAt;
  return { params: { ...kopya(DEFAULT_PARAMS), ...kopya(p) }, dimOff: dimOff && typeof dimOff === "object" ? kopya(dimOff) : {} };
}

/**
 * Kısmi takım verisi (toplu CSV satırı): takıma ait alanlar yeni veriden, sayfa tercihleri
 * ise o anki resimden gelir; geri kalan (notlar, damga, üretim özellikleri…) varsayılana döner.
 */
export function kismiYukle(mevcut, yeni) {
  const tercih = Object.fromEntries(TERCIHLER.filter((k) => k in mevcut).map((k) => [k, mevcut[k]]));
  return { params: { ...kopya(DEFAULT_PARAMS), ...kopya(tercih), ...kopya(yeni) }, dimOff: {} };
}

/** Kütüphane kaydı: geçerli resim + konumlar. */
export function kutuphaneKaydi(params, dimOff, ad) {
  return { ...kopya(params), toolName: ad, dimOff: kopya(dimOff || {}), savedAt: new Date().toISOString() };
}

export const DOSYA_SURUMU = 1;

/** Dosya olarak kaydedilecek metin (.mhk.json). */
export function dosyaMetni(params, dimOff) {
  return JSON.stringify({ uygulama: "mihenk-teknik-resim", surum: DOSYA_SURUMU, params: kopya(params), dimOff: kopya(dimOff || {}) }, null, 2);
}

/** Dosya metnini çözer; geçersizse anlaşılır bir hata fırlatır. */
export function dosyaCoz(metin) {
  let v;
  try { v = JSON.parse(String(metin).replace(/^﻿/, "")); } catch { throw new Error("Dosya okunamadı: geçerli bir JSON değil."); }
  if (!v || v.uygulama !== "mihenk-teknik-resim" || typeof v.params !== "object" || v.params === null) throw new Error("Bu dosya bir MİHENK teknik resim dosyası değil.");
  if (v.surum > DOSYA_SURUMU) throw new Error("Dosya daha yeni bir sürümle kaydedilmiş; uygulamayı güncelleyin.");
  return kayittanYukle({ ...v.params, dimOff: v.dimOff });
}

/** Dosya adı için güvenli metin. */
export const guvenliAd = (ad) => (ad || "teknik-resim").replace(/[\\/:*?"<>|]+/g, "_").trim() || "teknik-resim";
