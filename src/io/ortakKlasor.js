// Ortak kütüphane klasörü: ağ sürücüsü, OneDrive/Dropbox ya da paylaşılan bir klasörde `.mhk.json`
// dosyaları olarak takım kütüphanesi. Sunucu gerekmez; tarayıcının File System Access API'si
// (Chrome, Edge) kullanılır. Bu modül klasör tutamacıyla (DirectoryHandle) çalışan saf mantıktır;
// seçici ve izin penceresi arayüzde açılır.

import { dosyaMetni, dosyaCoz, guvenliAd } from "./dosya";

export const UZANTI = ".mhk.json";

/** Tarayıcı klasör seçmeyi destekliyor mu? (Firefox ve Safari'de yok.) */
export const destekleniyor = () => typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

/** Takım adından dosya adı: güvenli karakterler + .mhk.json */
export const dosyaAdiOlustur = (ad) => `${guvenliAd(ad || "isimsiz")}${UZANTI}`;

/** Klasördeki `.mhk.json` dosyaları (ada göre sıralı): [{ ad, tutamac }] */
export async function listele(klasor) {
  const liste = [];
  for await (const [ad, tutamac] of klasor.entries()) {
    if (tutamac.kind === "file" && ad.toLowerCase().endsWith(UZANTI)) liste.push({ ad, tutamac });
  }
  return liste.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** Dosya tutamacından resmi okur ({ params, dimOff }); bozuk dosyada anlaşılır hata fırlatır. */
export async function oku(tutamac) {
  const f = await tutamac.getFile();
  return dosyaCoz(await f.text());
}

/** Aynı adlı dosya klasörde var mı? */
export async function varMi(klasor, ad) {
  try { await klasor.getFileHandle(ad); return true; } catch (e) { if (e?.name === "NotFoundError") return false; throw e; }
}

/** Resmi klasöre yazar (aynı adlıyı değiştirir). @returns {string} yazılan dosya adı */
export async function yaz(klasor, params, dimOff) {
  const ad = dosyaAdiOlustur(params.toolName);
  const t = await klasor.getFileHandle(ad, { create: true });
  const w = await t.createWritable();
  try { await w.write(dosyaMetni(params, dimOff)); } finally { await w.close(); }
  return ad;
}

// ── Klasör tutamacını sonraki oturum için saklama (IndexedDB) ──
const VT = "mihenk-ortak", DEPO = "tutamac", ANAHTAR = "klasor";
const ac = () => new Promise((coz, red) => {
  const i = indexedDB.open(VT, 1);
  i.onupgradeneeded = () => i.result.createObjectStore(DEPO);
  i.onsuccess = () => coz(i.result);
  i.onerror = () => red(i.error);
});

export async function tutamacKaydet(klasor) {
  try {
    const db = await ac();
    await new Promise((c, r) => { const t = db.transaction(DEPO, "readwrite"); t.objectStore(DEPO).put(klasor, ANAHTAR); t.oncomplete = c; t.onerror = () => r(t.error); });
    db.close();
    return true;
  } catch { return false; }
}

export async function tutamacOku() {
  try {
    const db = await ac();
    const k = await new Promise((c, r) => { const q = db.transaction(DEPO).objectStore(DEPO).get(ANAHTAR); q.onsuccess = () => c(q.result || null); q.onerror = () => r(q.error); });
    db.close();
    return k;
  } catch { return null; }
}

export async function tutamacSil() {
  try {
    const db = await ac();
    await new Promise((c, r) => { const t = db.transaction(DEPO, "readwrite"); t.objectStore(DEPO).delete(ANAHTAR); t.oncomplete = c; t.onerror = () => r(t.error); });
    db.close();
  } catch { /* yok say */ }
}

/** Saklı klasör için okuma-yazma izni var mı? `iste` true ise (kullanıcı tıklamasında) izin penceresi açılır. */
export async function izinVarMi(klasor, iste = false) {
  const secenek = { mode: "readwrite" };
  if ((await klasor.queryPermission?.(secenek)) === "granted") return true;
  return iste && (await klasor.requestPermission?.(secenek)) === "granted";
}
