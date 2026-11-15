// Çizgi ikon seti (24×24, 1,8 px çizgi). Sistem yazı tipine bağlı değildir; her cihazda aynı görünür.

const YOLLAR = {
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  kapat: ["M18 6 6 18", "M6 6l12 12"],
  geriAl: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
  yinele: ["m15 14 5-5-5-5", "M20 9H9.5a5.5 5.5 0 0 0 0 11H13"],
  sifirla: ["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5"],
  dosya: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M9 13h6", "M9 17h6"],
  veri: ["M16 3l4 4-4 4", "M20 7H4", "M8 21l-4-4 4-4", "M4 17h16"],
  indir: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  uyari: ["M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z", "M12 9v4", "M12 17h.01"],
  tik: ["M20 6 9 17l-5-5"],
  artı: ["M12 5v14", "M5 12h14"],
  eksi: ["M5 12h14"],
  sigdir: ["M8 3H5a2 2 0 0 0-2 2v3", "M21 8V5a2 2 0 0 0-2-2h-3", "M3 16v3a2 2 0 0 0 2 2h3", "M16 21h3a2 2 0 0 0 2-2v-3"],
  asagi: ["m6 9 6 6 6-6"],
  kaydet: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21v-8H7v8", "M7 3v5h8"],
  cakisma: ["M3 3h9v9H3z", "M12 12h9v9h-9z"],
};

/** @param {{ad: keyof typeof YOLLAR, boyut?: number}} p */
export function Ikon({ ad, boyut = 18 }) {
  const yollar = YOLLAR[ad];
  if (!yollar) return null;
  return (
    <svg className="ikon-svg" width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {yollar.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export const IKON_ADLARI = Object.keys(YOLLAR);
