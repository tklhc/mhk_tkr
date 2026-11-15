// PDF'den iş emri metni çıkarır (tarayıcıda, sunucuya gönderilmez).
// Metin katmanı olmayan taranmış PDF'ler ve resimler okunamaz.

/**
 * pdf.js metin parçalarını satırlara birleştirir: aynı yükseklikteki parçalar soldan sağa dizilir,
 * satırlar yukarıdan aşağıya.
 * @param {Array<{s: string, x: number, y: number, w?: number}>} ogeler
 * @param {number} [satirAraligi] aynı satır sayılacak en büyük dikey fark
 */
export function satirlariBirlestir(ogeler, satirAraligi = 3) {
  const dolu = ogeler.filter((o) => o.s && o.s.trim() !== "");
  const sirali = [...dolu].sort((a, b) => b.y - a.y || a.x - b.x);
  const satirlar = [];
  for (const o of sirali) {
    const son = satirlar[satirlar.length - 1];
    if (son && Math.abs(son.y - o.y) <= satirAraligi) son.parcalar.push(o);
    else satirlar.push({ y: o.y, parcalar: [o] });
  }
  return satirlar.map((satir) => {
    const p = satir.parcalar.sort((a, b) => a.x - b.x);
    let metin = "";
    let oncekiSon = null;
    for (const o of p) {
      if (oncekiSon != null && o.x - oncekiSon > 1) metin += " ";
      metin += o.s.trim();
      oncekiSon = o.x + (o.w ?? o.s.length * 4);
    }
    return metin;
  }).join("\n");
}

/** PDF dosyasının (ArrayBuffer) tüm sayfalarının metni; sayfalar arasında boş satır. */
export async function pdfMetni(arrayBuffer) {
  const [pdfjs, isci] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ]);
  // Ayrı iş parçacığı yerine aynı iş parçacığında çalıştır (tek dosyalık derlemede dosya yolu yok)
  globalThis.pdfjsWorker = { WorkerMessageHandler: isci.WorkerMessageHandler };
  const belge = await pdfjs.getDocument({ data: arrayBuffer, isEvalSupported: false, useSystemFonts: true }).promise;
  const sayfalar = [];
  for (let i = 1; i <= belge.numPages; i++) {
    const sayfa = await belge.getPage(i);
    const icerik = await sayfa.getTextContent();
    sayfalar.push(satirlariBirlestir(icerik.items.map((o) => ({ s: o.str, x: o.transform[4], y: o.transform[5], w: o.width }))));
  }
  await belge.destroy();
  const metin = sayfalar.join("\n\n").trim();
  if (!metin) throw new Error("PDF'de okunabilir metin yok (taranmış resim olabilir).");
  return metin;
}
