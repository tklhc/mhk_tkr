// Onay akışı ve revizyon geçmişi. Saf işlevler: yeni params nesnesi döner, girdiyi değiştirmez.
//
//   TASLAK → (Onayla: onaylayan adı gerekli) → ONAYLANDI → (Yeni revizyon) → REVİZYON → Onayla …
//
// Revizyon harfi: "" → A → B … Z → AA. Her adım `revizyonlar` geçmişine bir satır ekler.

import { FIRMA } from "../config";

/** "" → "A", "A" → "B", "Z" → "AA", "AZ" → "BA" */
export function sonrakiRevizyon(rev) {
  const r = String(rev ?? "").trim().toUpperCase();
  if (!r) return "A";
  if (!/^[A-Z]+$/.test(r)) return `${r}+`;           // tanınmayan biçim: bozmadan işaretle
  const h = r.split("");
  let i = h.length - 1;
  while (i >= 0) {
    if (h[i] === "Z") { h[i] = "A"; i--; } else { h[i] = String.fromCharCode(h[i].charCodeAt(0) + 1); return h.join(""); }
  }
  return `A${h.join("")}`;
}

/** İşlem tarihi "YYYY-MM-DD" (yerel gün). */
export const bugunIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const gecmis = (p) => (Array.isArray(p.revizyonlar) ? p.revizyonlar : []);
const satir = (rev, tarih, aciklama, kisi) => ({ rev: rev || "-", tarih, aciklama: String(aciklama || "").trim(), kisi: String(kisi || "").trim() });

/** Onaylanabilir mi? Onaylayan adı dolu olmalı; zaten onaylıysa tekrar onaylanmaz. */
export function onaylanabilir(p) {
  if (p.stamp === "ONAYLANDI") return { var: false, neden: "Zaten onaylı. Değişiklik için yeni revizyon açın." };
  if (!String(p.approvedBy || "").trim()) return { var: false, neden: "Önce Onaylayan adını yazın." };
  return { var: true, neden: "" };
}

/** Onayla: damga ONAYLANDI, damga tarihi bugün, geçmişe "Onaylandı" satırı. */
export function onayla(p, bugun = bugunIso()) {
  const k = onaylanabilir(p);
  if (!k.var) throw new Error(k.neden);
  return { ...p, stamp: "ONAYLANDI", stampDate: bugun, revizyonlar: [...gecmis(p), satir(p.revision, bugun, "Onaylandı", p.approvedBy)] };
}

/**
 * Yeni revizyon: harf bir ilerler, damga REVİZYON olur, onay sıfırlanır (yeniden onay gerekir),
 * geçmişe açıklamalı satır eklenir. Açıklama boş olamaz (neyin değiştiği yazılmalı).
 */
export function yeniRevizyon(p, aciklama, bugun = bugunIso()) {
  const a = String(aciklama || "").trim();
  if (!a) throw new Error("Revizyon açıklaması yazın (neyin değiştiği).");
  const rev = sonrakiRevizyon(p.revision);
  const kisi = p.createdBy || FIRMA.cizen;
  return { ...p, revision: rev, stamp: "REVİZYON", stampDate: bugun, approvedBy: "", revizyonlar: [...gecmis(p), satir(rev, bugun, a, kisi)] };
}

/** Geçmişin son satırını siler (yanlışlıkla eklenen satır için); revizyon harfi geri alınmaz. */
export function sonSatiriSil(p) {
  return { ...p, revizyonlar: gecmis(p).slice(0, -1) };
}
