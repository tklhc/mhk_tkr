// Gerçek ölçekli PDF: sayfa boyutu kağıt boyutudur (A4 = 297×210 mm), resim sayfayı tam kaplar.
// Tarayıcının yazdır penceresinden bağımsızdır (orada "sayfaya sığdır" ölçeği bozabilir).
// İçerik 300 dpi, kayıpsız sıkıştırılmış (Flate) bir resimdir; metin seçilemez, vektör değildir.

const PT = 72 / 25.4;

async function deflate(bayt) {
  const akis = new Blob([bayt]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(akis).arrayBuffer());
}

const yaz = (s) => new TextEncoder().encode(s);

/**
 * Tek sayfalık PDF baytları.
 * @param {Uint8Array} rgb  piksel başına 3 bayt (R,G,B), satır satır
 * @param {number} px  genişlik (piksel)
 * @param {number} py  yükseklik (piksel)
 * @param {number} mmW sayfa genişliği (mm)
 * @param {number} mmH sayfa yüksekliği (mm)
 * @param {string} [baslik]
 */
export async function pdfOlustur(rgb, px, py, mmW, mmH, baslik = "MİHENK Teknik Resim") {
  const veri = await deflate(rgb);
  const w = +(mmW * PT).toFixed(3), h = +(mmH * PT).toFixed(3);
  const icerik = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
  const ascii = (s) => s.replace(/[^\x20-\x7E]/g, "?").replace(/[()\\]/g, "");
  const parcalar = [];   // her nesne: [baslik baytları, (isteğe bağlı) akış baytları]
  const nesne = (n, govde, akis) => {
    const ust = yaz(`${n} 0 obj\n${govde}${akis ? "\nstream\n" : "\n"}`);
    const alt = yaz(akis ? "\nendstream\nendobj\n" : "endobj\n");
    parcalar.push(akis ? [ust, akis, alt] : [ust, alt]);
  };
  nesne(1, "<< /Type /Catalog /Pages 2 0 R >>");
  nesne(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  nesne(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`);
  nesne(4, `<< /Length ${icerik.length} >>`, yaz(icerik));
  nesne(5, `<< /Type /XObject /Subtype /Image /Width ${px} /Height ${py} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${veri.length} >>`, veri);
  nesne(6, `<< /Title (${ascii(baslik)}) /Producer (MIHENK Teknik Resim) >>`);

  const bas = yaz("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const ofsetler = [];
  let konum = bas.length;
  for (const p of parcalar) { ofsetler.push(konum); konum += p.reduce((t, b) => t + b.length, 0); }
  let xref = `xref\n0 ${parcalar.length + 1}\n0000000000 65535 f \n`;
  for (const o of ofsetler) xref += `${String(o).padStart(10, "0")} 00000 n \n`;
  const son = yaz(`${xref}trailer\n<< /Size ${parcalar.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${konum}\n%%EOF\n`);

  const hepsi = [bas, ...parcalar.flat(), son];
  const cikti = new Uint8Array(hepsi.reduce((t, b) => t + b.length, 0));
  let i = 0;
  for (const b of hepsi) { cikti.set(b, i); i += b.length; }
  return cikti;
}

/** RGBA (canvas) → RGB. */
export function rgbaDanRgbye(rgba) {
  const n = rgba.length / 4;
  const rgb = new Uint8Array(n * 3);
  for (let i = 0, j = 0; i < n; i++, j += 3) { rgb[j] = rgba[i * 4]; rgb[j + 1] = rgba[i * 4 + 1]; rgb[j + 2] = rgba[i * 4 + 2]; }
  return rgb;
}
