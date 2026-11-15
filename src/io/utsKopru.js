// ÜTS köprüsü (alıcı taraf): iş emri yazısını bağlantıyla bu uygulamaya getirir.
//
//   https://…/teknik-resim/#ie=<base64url(UTF-8 iş emri yazısı)>
//
// Bağlantı açılınca "İş emrinden resim çiz" penceresi okunan değerlerle açılır; kullanıcı onaylamadan
// hiçbir şey çizilmez. Veri URL'nin # (parça) kısmında taşınır: sunucuya gönderilmez, günlüğe düşmez.
// ÜTS tarafında bu bağlantıyı üretecek bir düğme gerekir (bkz. docs/UTS-ENTEGRASYON.md); bu depo ÜTS'ye dokunmaz.

const ON_EK = "#ie=";
export const EN_COK_UZUNLUK = 12_000;   // karakter: aşırı büyük bağlantılar reddedilir (iş emri ~1,5 KB)

/** UTF-8 metni base64url'e çevirir (+ → -, / → _, dolgu yok). */
export function base64urlYaz(metin) {
  const bayt = new TextEncoder().encode(metin);
  let ikili = "";
  for (let i = 0; i < bayt.length; i += 0x8000) ikili += String.fromCharCode(...bayt.subarray(i, i + 0x8000));
  return btoa(ikili).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** base64url → UTF-8 metin; geçersizse null. */
export function base64urlOku(s) {
  try {
    const b64 = String(s).replace(/-/g, "+").replace(/_/g, "/");
    const ikili = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bayt = Uint8Array.from(ikili, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bayt);
  } catch { return null; }
}

/** İş emri yazısından bağlantı üretir. `taban` uygulamanın adresi (parçasız). */
export function ieBaglantisi(metin, taban) {
  return `${String(taban).replace(/#.*$/, "")}${ON_EK}${base64urlYaz(String(metin))}`;
}

/**
 * Adres parçasından (location.hash) iş emri yazısını okur. İş emri bağlantısı değilse, bozuksa,
 * boşsa ya da çok büyükse null.
 */
export function ieBaglantisindanOku(hash) {
  const h = String(hash || "");
  if (!h.startsWith(ON_EK) || h.length > EN_COK_UZUNLUK) return null;
  const m = base64urlOku(h.slice(ON_EK.length));
  if (m == null) return null;
  const t = m.replace(/\r/g, "").trim();
  // Metin kontrol karakteri taşımamalı (yazı dışı veri sızdırma/biçim bozma denemesi)
  return t && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t) ? t : null;
}
