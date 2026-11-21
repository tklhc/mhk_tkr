// ISO 128 (çizgiler) ve ISO 129 (ölçülendirme) yapı taşları.
// Tüm boyutlar kağıt üzerinde mm'dir.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSurukle } from "./Draggable";
import { toleransCoz, sapmaYaz } from "../geometry/tolerans";

// Çizgi grubu 0,5 (ISO 128-20): kalın 0,5 · ince 0,25
export const CIZGI = {
  kalin: 0.5,
  ince: 0.25,
  renk: "#000",
};
export const YAZI = {
  font: "'MHK Condensed','Arial Narrow',Arial,Helvetica,sans-serif",
  olcu: 3.5,      // ölçü yazısı
  tol: 2.5,       // tolerans sapmaları
  etiket: 2.5,
};
export const OK = { boy: 2.6, yari: 0.7 }; // dolu ok, ~30°

// Eksen (ince uzun çizgi-nokta) ve gizli kenar (ince kesik) desenleri, mm
export const DESEN = {
  eksen: "12 1.5 0.6 1.5",
  gizli: "3 1",
};

/** 8.5 → "8,5"; 10 → "10" (en fazla 3 ondalık) */
export const fmt = (v) => {
  if (v == null || !Number.isFinite(+v)) return "";
  return String(Math.round(+v * 1000) / 1000).replace(".", ",");
};

/** Yazı genişliği tahmini (dar yazı tipi) */
export const yaziGenisligi = (metin, h) => String(metin).length * h * 0.52;

export function Eksen({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} strokeDasharray={DESEN.eksen} />;
}

/** Ucu (x, y) noktasında, (ux, uy) yönünü gösteren dolu ok */
export function Ok({ x, y, ux, uy }) {
  const n = Math.hypot(ux, uy) || 1;
  const ax = ux / n, ay = uy / n;
  const bx = x - ax * OK.boy, by = y - ay * OK.boy;
  return <polygon points={`${x},${y} ${bx - ay * OK.yari},${by + ax * OK.yari} ${bx + ay * OK.yari},${by - ax * OK.yari}`} fill={CIZGI.renk} stroke="none" />;
}

// Sunucuda (testler) useLayoutEffect uyarı verir; orada useEffect kullanılır.
const useOlcumEfekti = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Tolerans, ana yazının yanında alt alta iki sapma olarak mı yazılacak? */
export function tolYigini(tol, anma) {
  const t = toleransCoz(tol, anma);
  return !!t && ((t.tur === "iso" && t.ust != null) || t.tur === "sapma");
}

/** Yığınlı toleransta yazının ölçü çizgisinden ne kadar yukarı alınacağı (alt sapma taban çizgisinin altına iner). */
export const YAZI_PAYI = { duz: 1, yigin: 2.8 };
/** Dikey ölçüde yazı çizginin sağındaysa taban çizgisinin ölçü çizgisine uzaklığı (1 mm boşluk + büyük harf boyu) */
export const DIS_YAZI_X = 1 + 0.75 * YAZI.olcu;

/**
 * Ölçü yazısı: değer + tolerans (ISO 129-1).
 *   ISO sınıfı:  ⌀10 h6  ⁰₋₀,₀₀₉  (sapmalar tabloda varsa)
 *   Simetrik:    75 ±0,05
 *   Sapmalı:     25 ⁺⁰,⁰²₋₀,₀₁
 * (x, y) yazının ortası / taban çizgisi; dondur: dikey ölçüde -90°.
 * Ana yazının ve sapmaların gerçek genişliği tarayıcıda ölçülür; böylece sapmalar
 * ana yazıya bitişik durur (sunucuda ve ilk çizimde tahmin kullanılır).
 */
/** Ölçü yazısının parçaları: ana satır (değer + ISO sınıfı / ±) ve varsa üst/alt sapma */
export function yaziParcalari({ deger, onEk = "", tol, anma, referans = false }) {
  const t = toleransCoz(tol, anma ?? deger);
  const ana = referans ? `(${onEk}${fmt(deger)})` : `${onEk}${fmt(deger)}`;   // referans (hesaplanan) ölçü parantez içinde, ISO 129-1
  let ek = "";       // ana satıra eklenen (ISO sınıfı, ±)
  let ust = null, alt = null;
  if (t?.tur === "iso") {
    ek = ` ${t.sinif}`;
    if (t.ust != null) { ust = sapmaYaz(t.ust); alt = sapmaYaz(t.alt); }
  } else if (t?.tur === "simetrik") {
    ek = ` ±${fmt(t.ust)}`;
  } else if (t?.tur === "sapma") {
    ust = sapmaYaz(t.ust); alt = sapmaYaz(t.alt);
  } else if (tol && String(tol).trim()) {
    ek = ` ${String(tol).trim()}`; // tanınmayan metin olduğu gibi
  }
  return { anaMetin: ana + ek, ust, alt };
}

/** Ölçü yazısının tahmini genişliği (mm); ok arasına sığıp sığmadığına karar vermek için */
export function olcuYaziGenisligi(o) {
  const { anaMetin, ust, alt } = yaziParcalari(o);
  return yaziGenisligi(anaMetin, YAZI.olcu) + (ust != null ? 0.7 + Math.max(yaziGenisligi(ust, YAZI.tol), yaziGenisligi(alt, YAZI.tol)) : 0);
}

export function OlcuYazisi({ x, y, deger, onEk = "", tol, anma, dondur = false, hizala = "middle", referans = false }) {
  const { anaMetin, ust, alt } = yaziParcalari({ deger, onEk, tol, anma, referans });

  const refA = useRef(null), refU = useRef(null), refL = useRef(null);
  const [olc, setOlc] = useState(null);
  useOlcumEfekti(() => {
    const uzun = (r) => { try { const v = r.current?.getComputedTextLength?.(); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; } };
    const yeni = { a: uzun(refA), u: uzun(refU), l: uzun(refL) };
    if (yeni.a == null) return;
    setOlc((o) => (o && ["a", "u", "l"].every((k) => Math.abs((o[k] ?? 0) - (yeni[k] ?? 0)) < 0.02) ? o : yeni));
  }, [anaMetin, ust, alt]);

  const BOSLUK = 0.7;
  const wAna = olc?.a ?? yaziGenisligi(anaMetin, YAZI.olcu);
  const wSapma = ust != null ? Math.max(olc?.u ?? yaziGenisligi(ust, YAZI.tol), olc?.l ?? yaziGenisligi(alt, YAZI.tol)) : 0;
  const w = wAna + (ust != null ? BOSLUK + wSapma : 0);
  const x0 = hizala === "start" ? x : hizala === "end" ? x - w : x - w / 2;
  const tx = x0 + wAna + BOSLUK;
  // Sapma yığını: üst sapmanın tepesi ana yazının tepesiyle hizalı, alt sapma taban çizgisinin biraz altında
  const parcalar = [
    <text key="a" ref={refA} x={x0} y={y} fontSize={YAZI.olcu} fontFamily={YAZI.font} fill={CIZGI.renk}>{anaMetin}</text>,
  ];
  if (ust != null) {
    parcalar.push(
      <text key="u" ref={refU} x={tx} y={y - 0.7} fontSize={YAZI.tol} fontFamily={YAZI.font} fill={CIZGI.renk}>{ust}</text>,
      <text key="l" ref={refL} x={tx} y={y + 1.55} fontSize={YAZI.tol} fontFamily={YAZI.font} fill={CIZGI.renk}>{alt}</text>
    );
  }
  return dondur ? <g transform={`rotate(-90 ${x} ${y})`}>{parcalar}</g> : <g>{parcalar}</g>;
}

/**
 * Doğrusal ölçü.
 * yon "yatay": p1, p2 ölçülen noktalar; ölçü çizgisi y = konum'da.
 * yon "dikey": ölçü çizgisi x = konum'da.
 * Sürüklenince yalnız ölçü çizgisinin yeri değişir; yardımcı çizgiler uzar/kısalır.
 * referans: başka ölçülerden hesaplanan ölçü, parantez içinde yazılır.
 */
export function Olcu({ p1, p2, yon = "yatay", konum, deger, onEk, tol, anma, id, offsets, setOffsets, alan, referans = false, yaziYani = "hi", yaziSagda = false, dikeyDisari = false }) {
  const yatay = yon === "yatay";
  const { off, olaylar } = useSurukle(id, offsets, setOffsets, yatay ? "y" : "x");
  const k = konum + (yatay ? off.dy : off.dx);
  const BOSLUK = 1, TASMA = 2;

  // Ölçü çizgisinin uçları (eksen boyunca)
  const a = yatay ? p1[0] : p1[1];
  const b = yatay ? p2[0] : p2[1];
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const uzunluk = hi - lo;
  if (uzunluk < 0.2) return null;
  const P = (t, kk) => (yatay ? [t, kk] : [kk, t]); // (eksen boyu, ölçü çizgisi konumu) → (x, y)

  const yardimci = [p1, p2].map((p, i) => {
    const kaynak = yatay ? p[1] : p[0];
    const t = yatay ? p[0] : p[1];
    const isaret = Math.sign(k - kaynak) || 1;
    if (Math.abs(k - kaynak) < BOSLUK + 0.1) return null;
    const [x1, y1] = P(t, kaynak + isaret * BOSLUK);
    const [x2, y2] = P(t, k + isaret * TASMA);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />;
  });

  // Ok yeri: sığıyorsa içte, sığmıyorsa dışta (çizgi dışa uzar)
  const icte = uzunluk >= 2 * OK.boy + 1.5;
  const uzat = icte ? 0 : OK.boy + 3;
  // Yatay ölçüde yazı oklar arasına rahat sığmıyorsa ölçü çizgisinin uzantısına, okların dışına yazılır (ISO 129-1).
  // Dikey (çap) ölçüde yazı çizginin yanında durur, çizgiden uzun olsa da eksene ortalanır;
  // dikeyDisari (ör. parçanın içindeki boğaz çapı): sığmayan yazı çizginin uzantısına, parçanın dışına (varsayılan aşağı; "lo" yukarı).
  const wYazi = olcuYaziGenisligi({ deger, onEk, tol, anma, referans });
  const disari = (yatay || dikeyDisari) && uzunluk < wYazi + 2 * OK.boy + 2 ? (yaziYani === "lo" ? "lo" : "hi") : null;
  const YAZI_ARA = 1.2;
  const disUc = disari === "hi" ? hi + uzat + YAZI_ARA : lo - uzat - YAZI_ARA;   // yazının ölçüye yakın ucu
  const [cx1, cy1] = P(disari === "lo" ? disUc - wYazi - 0.5 : lo - uzat, k);
  const [cx2, cy2] = P(disari === "hi" ? disUc + wYazi + 0.5 : hi + uzat, k);
  const [ox1, oy1] = P(lo, k);
  const [ox2, oy2] = P(hi, k);
  // İçte: oklar dışa (lo ucunda -eksen, hi ucunda +eksen); dışta: içe bakar
  const ex = yatay ? 1 : 0, ey = yatay ? 0 : 1;
  const sy = icte ? -1 : 1;
  const oklar = [
    <Ok key="o1" x={ox1} y={oy1} ux={sy * ex} uy={sy * ey} />,
    <Ok key="o2" x={ox2} y={oy2} ux={-sy * ex} uy={-sy * ey} />,
  ];

  // Yazı: yatayda çizginin üstünde, dikeyde solunda (sağdan okunur); sapma yığını varsa daha yukarı/uzağa.
  // yaziSagda: takımın önündeki (uç tarafındaki) çap ölçüsünde yazı çizginin sağına, takımdan uzağa yazılır.
  // -90° dönen yazının gövdesi taban çizgisinin soluna düşer: taban çizgisi 1 mm boşluk + büyük harf boyu kadar sağda.
  const pay = tolYigini(tol, anma ?? deger) ? YAZI_PAYI.yigin : YAZI_PAYI.duz;
  const orta = disari ? disUc : (lo + hi) / 2;
  // Dikeyde yazı -90° döner: "start" yukarı, "end" aşağı doğru uzar
  const hizala = !disari ? "middle" : yatay ? (disari === "hi" ? "start" : "end") : (disari === "hi" ? "end" : "start");
  const yazi = yatay
    ? <OlcuYazisi x={orta} y={k - pay} deger={deger} onEk={onEk} tol={tol} anma={anma} referans={referans} hizala={hizala} />
    : <OlcuYazisi x={yaziSagda ? k + DIS_YAZI_X : k - pay} y={orta} deger={deger} onEk={onEk} tol={tol} anma={anma} referans={referans} hizala={hizala} dondur />;

  return (
    <g {...olaylar} data-alan={alan}>
      {yardimci}
      <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      {oklar}
      {yazi}
      {/* Tutma alanı (görünmez): ince çizgiyi sürüklemeyi kolaylaştırır */}
      {id && setOffsets && (yatay
        ? <rect x={lo} y={k - 4.5} width={uzunluk} height={6} fill="transparent" />
        : <rect x={k - 4.5} y={lo} width={6} height={uzunluk} fill="transparent" />)}
    </g>
  );
}

/** Yay üzerinde açı ölçüsü. Açılar SVG ekran derecesi (saat yönü pozitif). */
export function AciOlcusu({ cx, cy, r, a1, a2, metin, metinAci, id, offsets, setOffsets }) {
  const { off, olaylar } = useSurukle(id, offsets, setOffsets, null);
  const rad = (a) => (a * Math.PI) / 180;
  const nokta = (a, rr = r) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))];
  const [x1, y1] = nokta(a1);
  const [x2, y2] = nokta(a2);
  const buyuk = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  // Teğet yönler (oklar yay uçlarında dışa bakar)
  const t1 = [Math.sin(rad(a1)), -Math.cos(rad(a1))].map((v) => v * (sweep ? 1 : -1));
  const t2 = [-Math.sin(rad(a2)), Math.cos(rad(a2))].map((v) => v * (sweep ? 1 : -1));
  const ma = metinAci ?? (a1 + a2) / 2;
  const [tx, ty] = nokta(ma, r + 1.6);
  const cosM = Math.cos(rad(ma));
  const hiz = cosM > 0.3 ? "start" : cosM < -0.3 ? "end" : "middle";
  return (
    <g {...olaylar}>
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${buyuk} ${sweep} ${x2} ${y2}`} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <Ok x={x1} y={y1} ux={t1[0]} uy={t1[1]} />
      <Ok x={x2} y={y2} ux={t2[0]} uy={t2[1]} />
      <g transform={`translate(${off.dx},${off.dy})`}>
        <text x={tx} y={ty + YAZI.olcu * 0.35} fontSize={YAZI.olcu} fontFamily={YAZI.font} fill={CIZGI.renk} textAnchor={hiz}>{metin}</text>
      </g>
    </g>
  );
}

/** Kılavuz çizgisi: hedefte ok, dirsekten sonra yatay omuz ve yazı. */
export function Kilavuz({ hedef, dirsek, metin, id, offsets, setOffsets }) {
  const { off, olaylar } = useSurukle(id, offsets, setOffsets, null);
  const dx = dirsek[0] + off.dx, dy = dirsek[1] + off.dy;
  const sag = dx >= hedef[0];
  const omuz = 2.5;
  const w = yaziGenisligi(metin, YAZI.olcu);
  const ex = sag ? dx + omuz : dx - omuz;
  return (
    <g {...olaylar}>
      <line x1={hedef[0]} y1={hedef[1]} x2={dx} y2={dy} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <line x1={dx} y1={dy} x2={ex} y2={dy} stroke={CIZGI.renk} strokeWidth={CIZGI.ince} />
      <Ok x={hedef[0]} y={hedef[1]} ux={hedef[0] - dx} uy={hedef[1] - dy} />
      <text x={sag ? ex + 0.6 : ex - 0.6} y={dy + YAZI.olcu * 0.35} fontSize={YAZI.olcu} fontFamily={YAZI.font} fill={CIZGI.renk} textAnchor={sag ? "start" : "end"}>{metin}</text>
      <rect x={sag ? ex : ex - w - 1} y={dy - 3} width={w + 1} height={4.5} fill="transparent" />
    </g>
  );
}
