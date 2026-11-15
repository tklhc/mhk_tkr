// Resim dışa aktarma: SVG, PNG, PDF (yazdır). Sayfa mm cinsindendir; çıktıda
// width/height mm olarak yazılır, böylece SVG ve PDF gerçek ölçekte açılır.

export const PX_PER_MM = 12; // ≈ 305 dpi

const NS = "http://www.w3.org/2000/svg";

/** Ekrandaki SVG'yi çıktıya uygun hale getirir (zoom, gölge, id kaldırılır). */
function temizKlon(svgEl) {
  const klon = svgEl.cloneNode(true);
  const vb = svgEl.viewBox.baseVal;
  klon.setAttribute("xmlns", NS);
  klon.setAttribute("width", `${vb.width}mm`);
  klon.setAttribute("height", `${vb.height}mm`);
  klon.removeAttribute("style");
  klon.removeAttribute("id");
  return { klon, w: vb.width, h: vb.height };
}

export function svgMetni(svgEl) {
  return new XMLSerializer().serializeToString(temizKlon(svgEl).klon);
}

export function dosyaIndir(blob, ad) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = ad; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function svgIndir(svgEl, ad) {
  dosyaIndir(new Blob([svgMetni(svgEl)], { type: "image/svg+xml" }), ad);
}

/** PNG blob'u: beyaz zemin, mm başına PX_PER_MM piksel. */
export function pngBlobu(svgEl, pxPerMm = PX_PER_MM) {
  const { klon, w, h } = temizKlon(svgEl);
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(klon)], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * pxPerMm);
      canvas.height = Math.round(h * pxPerMm);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG üretilemedi"))), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(svgUrl); reject(new Error("SVG yüklenemedi")); };
    img.src = svgUrl;
  });
}

export async function pngIndir(svgEl, ad) {
  dosyaIndir(await pngBlobu(svgEl), ad);
}

/** Yazdır penceresi: sayfa boyutu = kağıt boyutu, kenar boşluğu yok → gerçek ölçek. */
export function pdfYazdir(svgEl, baslik) {
  const { klon, w, h } = temizKlon(svgEl);
  const svg = new XMLSerializer().serializeToString(klon);
  const esc = (s) => String(s).replace(/[<&>]/g, "");
  const pencere = window.open("", "_blank");
  if (!pencere) { alert("Açılır pencere engellendi. Tarayıcıda bu site için izin verin."); return; }
  pencere.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(baslik)}</title>` +
    `<style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0;background:#fff}svg{display:block;width:${w}mm;height:${h}mm}</style></head><body>${svg}</body></html>`
  );
  pencere.document.close();
  setTimeout(() => pencere.print(), 500);
}
