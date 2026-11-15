// Uygulama ikonlarını (public/icon-192.png, icon-512.png, icon-maskable-512.png) üretir. Dış bağımlılık yok.
//   node scripts/ikon-uret.mjs
// Koyu zemin üzerinde turuncu "M": çizgi parçalarına uzaklıktan, 3×3 aşırı örneklemeyle yumuşatılmış.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(kok, { recursive: true });

const ZEMIN = [19, 26, 37], TURUNCU = [240, 160, 48];

/** Noktanın doğru parçasına uzaklığı */
function uzaklik(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Birim kare (0..1) içinde "M": iki dikey, iki eğik çizgi. `pay` güvenli alanı (maskelenebilir ikon için) daraltır. */
function mParcalari(pay) {
  const a = 0.5 - 0.5 * (1 - 2 * pay) * 0.62, b = 0.5 + 0.5 * (1 - 2 * pay) * 0.62;       // sol ve sağ x
  const ust = 0.5 - 0.31 * (1 - 2 * pay), alt = 0.5 + 0.31 * (1 - 2 * pay);
  const orta = ust + (alt - ust) * 0.62;
  return [[a, alt, a, ust], [b, alt, b, ust], [a, ust, 0.5, orta], [b, ust, 0.5, orta]];
}

function ciz(boyut, { yuvarlak, pay }) {
  const piksel = Buffer.alloc(boyut * boyut * 4);
  const parcalar = mParcalari(pay);
  const kalinlik = 0.105 * (1 - 2 * pay);
  const r = yuvarlak ? 0.2 : 0;
  for (let y = 0; y < boyut; y++) {
    for (let x = 0; x < boyut; x++) {
      let m = 0, zemin = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const u = (x + (sx + 0.5) / 3) / boyut, v = (y + (sy + 0.5) / 3) / boyut;
        // yuvarlatılmış kare içinde mi?
        const kx = Math.max(Math.abs(u - 0.5) - (0.5 - r), 0), ky = Math.max(Math.abs(v - 0.5) - (0.5 - r), 0);
        if (Math.hypot(kx, ky) <= r) zemin++;
        if (parcalar.some((p) => uzaklik(u, v, p) <= kalinlik / 2)) m++;
      }
      const i = (y * boyut + x) * 4, kap = m / 9, zm = zemin / 9;
      for (let k = 0; k < 3; k++) piksel[i + k] = Math.round(ZEMIN[k] * (1 - kap) + TURUNCU[k] * kap);
      piksel[i + 3] = Math.round(255 * zm);
    }
  }
  return piksel;
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function parca(tip, veri) {
  const u = Buffer.alloc(4); u.writeUInt32BE(veri.length);
  const t = Buffer.concat([Buffer.from(tip), veri]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(t));
  return Buffer.concat([u, t, c]);
}
function png(boyut, piksel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(boyut, 0); ihdr.writeUInt32BE(boyut, 4); ihdr[8] = 8; ihdr[9] = 6;       // 8 bit, RGBA
  const satir = boyut * 4, ham = Buffer.alloc((satir + 1) * boyut);
  for (let y = 0; y < boyut; y++) { ham[y * (satir + 1)] = 0; piksel.copy(ham, y * (satir + 1) + 1, y * satir, (y + 1) * satir); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), parca("IHDR", ihdr), parca("IDAT", deflateSync(ham, { level: 9 })), parca("IEND", Buffer.alloc(0))]);
}

for (const [ad, boyut, secenek] of [
  ["icon-192.png", 192, { yuvarlak: true, pay: 0 }],
  ["icon-512.png", 512, { yuvarlak: true, pay: 0 }],
  ["icon-maskable-512.png", 512, { yuvarlak: false, pay: 0.1 }],   // işletim sistemi kendi maskesini uygular: tam dolu zemin, içerik güvenli alanda
]) {
  writeFileSync(join(kok, ad), png(boyut, ciz(boyut, secenek)));
  console.log("yazıldı:", ad);
}
