// Çizim yazı tipi: Roboto Condensed (SIL OFL), Latin + Latin Ek (Türkçe harfler), normal ve kalın.
// Derlemede base64 olarak tek dosyaya gömülür; hem uygulamaya hem de dışa aktarılan
// SVG/PNG/PDF'ye eklenir, böylece her cihazda aynı genişlikte yazı çıkar.
import latin400 from "@fontsource/roboto-condensed/files/roboto-condensed-latin-400-normal.woff2?inline";
import latin700 from "@fontsource/roboto-condensed/files/roboto-condensed-latin-700-normal.woff2?inline";
import ext400 from "@fontsource/roboto-condensed/files/roboto-condensed-latin-ext-400-normal.woff2?inline";
import ext700 from "@fontsource/roboto-condensed/files/roboto-condensed-latin-ext-700-normal.woff2?inline";

export const YAZI_AILESI = "MHK Condensed";

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EK = "U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF";

const yuz = (agirlik, veri, aralik) =>
  `@font-face{font-family:"${YAZI_AILESI}";font-style:normal;font-weight:${agirlik};font-display:block;src:url(${veri}) format("woff2");unicode-range:${aralik}}`;

/** @font-face kuralları (CSS metni). */
export const YAZI_CSS = [yuz(400, latin400, LATIN), yuz(400, ext400, LATIN_EK), yuz(700, latin700, LATIN), yuz(700, ext700, LATIN_EK)].join("\n");

/** Sayfaya ekler ve yazı tiplerinin yüklenmesini bekler (ölçüm doğru olsun diye); en çok `sure` ms bekler. */
export async function yaziHazirla(sure = 2000) {
  if (typeof document === "undefined") return;
  const st = document.createElement("style");
  st.textContent = YAZI_CSS;
  document.head.appendChild(st);
  if (!document.fonts?.load) return;
  const yukle = Promise.all(["400", "700"].flatMap((a) => [`${a} 10px "${YAZI_AILESI}"`].map((f) => document.fonts.load(f, "Aağşİı0⌀")))).catch(() => {});
  await Promise.race([yukle, new Promise((r) => setTimeout(r, sure))]);
}
