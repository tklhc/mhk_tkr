// İş emri yazısından Teknik Resim bağlantısı üretir (ÜTS'ye dokunmadan denemek için).
//   node scripts/ie-baglantisi.mjs <is-emri.txt> [uygulama-adresi]
// Çıkan bağlantıyı tarayıcıda açınca "İş emrinden resim çiz" penceresi okunan değerlerle açılır.
import { readFileSync } from "node:fs";
import { ieBaglantisi } from "../src/io/utsKopru.js";

const [dosya, adres = "http://localhost:5173/"] = process.argv.slice(2);
if (!dosya) {
  console.error("Kullanım: node scripts/ie-baglantisi.mjs <is-emri.txt> [uygulama-adresi]");
  process.exit(1);
}
console.log(ieBaglantisi(readFileSync(dosya, "utf-8"), adres));
