// Firma bilgileri. Antette, katalogta ve çıktılarda kullanılır; kodda başka yerde yazılmaz.
// Varsayılanlar MİHENK'in bilgileridir; Dosya → Firma ayarları ile bu tarayıcıda değiştirilir.

export const FIRMA_VARSAYILAN = {
  ad: "MİHENK KESİCİ TAKIMLAR",
  cizen: "Mehmet Taha KÜLAHCI",
  tel: "0507 321 62 80",
  eposta: "taha@mihenk.net",
  web: "www.mihenkkesicitakimlar.com",
  logo: "",            // boşsa yerleşik MİHENK logosu; doluysa "data:image/..." adresi
};

const ALANLAR = Object.keys(FIRMA_VARSAYILAN);
const ANAHTAR = "mihenk-firma";
export const LOGO_AZAMI = 400_000;     // bayt (data adresi uzunluğu): taslak ve dosyalar şişmesin

/** Çalışan firma bilgisi; ayar yapılınca yerinde güncellenir (çizim bileşenleri okur). */
export const FIRMA = { ...FIRMA_VARSAYILAN };

/** Bilinmeyen alanları ve geçersiz değerleri atar; yalnız geçerli, kırpılmış alanları verir. */
export function firmaSuz(girdi) {
  const o = {};
  if (!girdi || typeof girdi !== "object") return o;
  for (const k of ALANLAR) {
    const v = girdi[k];
    if (typeof v !== "string") continue;
    if (k === "logo") {
      if (v === "" || (/^data:image\/(png|jpeg|svg\+xml|webp);/.test(v) && v.length <= LOGO_AZAMI)) o.logo = v;
    } else {
      o[k] = v.trim().slice(0, 80);
    }
  }
  return o;
}

/** Saklanan ayarları yükler (tarayıcıda; yoksa varsayılanlar kalır). */
export function firmaYukle() {
  try {
    const k = JSON.parse(localStorage.getItem(ANAHTAR));
    Object.assign(FIRMA, firmaSuz(k));
  } catch { /* depolama kapalı ya da bozuk: varsayılanlar */ }
  return FIRMA;
}

/** Ayarları uygular ve saklar. Boş ad ya da çizen varsayılana döner. @returns {boolean} saklanabildi mi */
export function firmaKaydet(girdi) {
  const s = firmaSuz({ ...FIRMA, ...girdi });
  for (const k of ["ad", "cizen"]) if (!s[k]) s[k] = FIRMA_VARSAYILAN[k];
  Object.assign(FIRMA, s);
  try { localStorage.setItem(ANAHTAR, JSON.stringify(FIRMA)); return true; } catch { return false; }
}

/** Varsayılanlara döner ve saklanan ayarı siler. */
export function firmaSifirla() {
  Object.assign(FIRMA, FIRMA_VARSAYILAN);
  try { localStorage.removeItem(ANAHTAR); } catch { /* yok say */ }
  return FIRMA;
}

if (typeof localStorage !== "undefined") firmaYukle();
