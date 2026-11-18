import { takimProfili, tamKontur, svgYolu, parcaUclari, ucKonisiBoyu } from "../geometry/profil";
import { CIZGI, Eksen, Olcu, Kilavuz, fmt } from "./iso";
import { kaplamaRengi, silindirDuraklari } from "./stil";
import { mt, yonMetni } from "./metinler";

const DEG = Math.PI / 180;
const n = (v) => +v.toFixed(3);

/** Verilen x konumunda (yan görünüşte) konturun ulaştığı en büyük yarıçap. */
function yaricapAt(g, x) {
  let m = 0;
  for (const s of g.ust) {
    const u = parcaUclari(s);
    if (Math.abs(u.x1 - x) < 1e-6) m = Math.max(m, u.y1);
    if (Math.abs(u.x2 - x) < 1e-6) m = Math.max(m, u.y2);
  }
  return m;
}

/** Çapın (r) ilk ulaşıldığı en sağ x (ölçü yardımcı çizgisinin başlayacağı yer). */
function xCapta(g, r) {
  let m = 0;
  for (const s of g.ust) {
    const u = parcaUclari(s);
    if (Math.abs(u.y1 - r) < 1e-6) m = Math.max(m, u.x1);
    if (Math.abs(u.y2 - r) < 1e-6) m = Math.max(m, u.x2);
  }
  return m;
}

/** Yan görünüşteki helis oluk izleri: yarım silindirin sinüs izdüşümü. */
function oluklar(g, params) {
  const { z, helix, helixHand } = params;
  const hD = g.D / 2;
  if (!(z >= 1) || !(helix >= 0) || g.tip === "stepdrill" || !(hD > 0)) return { yollar: [], k: 0 };
  const x0 = g.x.boyunSonu;
  const k = helix > 0 ? (2 * Math.tan(helix * DEG)) / g.D : 0; // rad / mm
  const yon = helixHand === "Sol" ? 1 : -1; // sağ helis: ucu sağa bakan takımda görünen yüzde "\" (vida kuralı)
  const yollar = [];
  for (let i = 0; i < z; i++) {
    const phi0 = (2 * Math.PI * i) / z;
    // Yalnız ön yüzdeki (cos φ > 0) parçalar görünür; her görünür aralık ayrı bir çizgi
    const parcalar = [];
    let cur = null;
    for (let x = x0; x <= g.L + 1e-9; x += 0.25) {
      const phi = phi0 + yon * k * (x - x0);
      if (Math.cos(phi) > 0) {
        if (!cur) { cur = []; parcalar.push(cur); }
        cur.push({ x, y: hD * Math.sin(phi) });
      } else cur = null;
    }
    yollar.push(parcalar);
  }
  return { yollar, k, yon };
}

export function YanGorunus({ params, yerlesim, dimOff, setDimOff }) {
  const g = takimProfili(params);
  if (!(g.D > 0) || !(g.d > 0) || !(g.L > 0)) return null;

  const { olcek: s, ox, oy } = yerlesim;
  const X = (x) => ox + x * s;
  const Y = (r) => oy - r * s;
  const donustur = (x, r) => [n(X(x)), n(Y(r))];

  const kontur = tamKontur(g);
  const yol = svgYolu(kontur, donustur) + " Z";
  const hmax = Math.max(g.D, g.d) / 2;
  const ust = Y(hmax), alt = oy + hmax * s;
  const hD = g.D / 2, hd = g.d / 2, hN = g.nD / 2;
  const stepdrill = g.tip === "stepdrill";
  const ozel = g.tip === "custom";
  const ek = { offsets: dimOff, setOffsets: setDimOff };

  const e = [];

  // ── Sunum stili: bölge başına silindirik gölge (kontura kırpılır) ──
  if (params.sunum !== false) {
    const renkK = kaplamaRengi(params.coating, params.colCut);
    const bolgeler = [{ id: "S", x0: 0, x1: g.x.sapSonu, r: hd, renk: params.colShank }];
    if (g.x.boyunSonu > g.x.sapSonu + 1e-9) bolgeler.push({ id: "N", x0: g.x.sapSonu, x1: g.x.boyunSonu, r: Math.max(hd, hN), renk: params.colNeck });
    if (stepdrill) g.kademeler.forEach((kd, i) => bolgeler.push({ id: `K${i}`, x0: kd.sol, x1: kd.sag, r: kd.dia / 2, renk: renkK }));
    else bolgeler.push({ id: "K", x0: g.x.boyunSonu, x1: g.L, r: hD, renk: renkK });
    e.push(
      <defs key="ys-defs">
        <clipPath id="yan-dolgu-klip"><path d={yol} /></clipPath>
        <filter id="yan-golge" x="-3%" y="-8%" width="106%" height="122%">
          <feDropShadow dx="0.5" dy="1.1" stdDeviation="0.9" floodColor="#000" floodOpacity="0.28" />
        </filter>
        {bolgeler.map((b) => (
          <linearGradient key={b.id} id={`ys-${b.id}`} x1="0" y1="0" x2="0" y2="1">
            {silindirDuraklari(b.renk).map(([p, c]) => <stop key={p} offset={`${p}%`} stopColor={c} />)}
          </linearGradient>
        ))}
      </defs>
    );
    e.push(
      <g key="ys-dolgu" filter="url(#yan-golge)">
        <g clipPath="url(#yan-dolgu-klip)">
          {bolgeler.filter((b) => b.x1 - b.x0 > 1e-6).map((b) => (
            <rect key={b.id} x={n(X(b.x0) - 0.05)} y={n(Y(b.r))} width={n((b.x1 - b.x0) * s + 0.1)} height={n(2 * b.r * s)} fill={`url(#ys-${b.id})`} />
          ))}
        </g>
      </g>
    );
  }

  // ── Olukları (kontur içine kırp) ──
  const { yollar, k } = oluklar(g, params);
  const klipId = "yan-kontur";
  e.push(
    <defs key="defs">
      <clipPath id={klipId}><path d={yol} /></clipPath>
    </defs>
  );
  if (yollar.length) {
    e.push(
      <g key="oluk" clipPath={`url(#${klipId})`} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.ince}>
        {yollar.flatMap((parcalar, i) => parcalar.map((p, j) => {
          const d = p.map((q, t) => `${t === 0 ? "M" : "L"} ${n(X(q.x))} ${n(Y(q.y))}`).join(" ");
          return <path key={`${i}-${j}`} d={d} />;
        }))}
      </g>
    );
  }

  // ── Kontur ve görünür kenarlar (kalın) ──
  e.push(<path key="kontur" d={yol} fill="none" stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} strokeLinejoin="round" />);
  g.kenarlar.forEach((kn, i) => {
    e.push(<line key={`kn${i}`} x1={n(X(kn.x))} y1={n(Y(-kn.r))} x2={n(X(kn.x))} y2={n(Y(kn.r))} stroke={CIZGI.renk} strokeWidth={CIZGI.kalin} />);
  });

  // ── Eksen ──
  e.push(<Eksen key="eksen" x1={n(X(0) - 4)} y1={oy} x2={n(X(g.L) + 4)} y2={oy} />);

  // ── ÖLÇÜLER ──
  const sapR = hd; // sap düzlüğü üst yarıyı alçaltsa da alt yarı tam daire

  // Alt: kesici boy (l1) ve toplam boy (L)
  const altSatir = (i) => alt + 7 * i;
  if (!stepdrill && !ozel && params.showDiml1) {
    const xs = g.x.boyunSonu;
    e.push(<Olcu key="dl1" id="dl1" alan="l1" yon="yatay" p1={[X(xs), Y(-yaricapAt(g, xs))]} p2={[X(g.L), Y(-yaricapAt(g, g.L))]}
      konum={altSatir(1)} deger={g.l1} tol={params.toll1} anma={g.l1} {...ek} />);
  }
  if (params.showDimL) {
    e.push(<Olcu key="dL" id="dL" alan="L" yon="yatay" p1={[X(0), Y(-sapR)]} p2={[X(g.L), Y(-yaricapAt(g, g.L))]}
      konum={altSatir(stepdrill || ozel ? 1 : 2)} deger={g.L} tol={params.tolL} anma={g.L} {...ek} />);
  }

  // Üst: boğaz boyu (l2) ya da kademe boyları
  if (g.l2 > 0 && params.showDiml2) {
    e.push(<Olcu key="dl2" id="dl2" alan="l2" yon="yatay" p1={[X(g.x.gecisSonu), Y(yaricapAt(g, g.x.gecisSonu))]} p2={[X(g.x.boyunSonu), Y(yaricapAt(g, g.x.boyunSonu))]}
      konum={ust - 7} deger={g.l2} tol={params.toll2} anma={g.l2} {...ek} />);
  }
  // Havşalı matkap ("toplam"): 1. kademenin boyu uç konisi bittiği yerden havşa başlangıcına (alt satır),
  // kesici (helis) boyu uçtan tek ölçü (üst satır). Diğer kademelerin boyu ayrı gösterilmez;
  // şafta eşit çaplı kademenin çapı sol taraftaki d ölçüsünde zaten var.
  const toplamOlcu = stepdrill && params.kademeOlcu === "toplam";
  if (toplamOlcu && params.showDiml1 !== false) {
    const k0 = g.kademeler[0];
    const xKoni = k0.sag - k0.gecisBoyu;   // uç konisinin bittiği yer
    e.push(<Olcu key="dst0" id="dst0" yon="yatay" p1={[X(k0.sol), Y(yaricapAt(g, k0.sol))]} p2={[X(xKoni), Y(k0.dia / 2)]}
      konum={ust - 7} deger={k0.boy} tol={k0.tolLen} anma={k0.boy} {...ek} />);
    e.push(<Olcu key="dst-toplam" id="dst-toplam" yon="yatay" p1={[X(g.L - g.l1), Y(yaricapAt(g, g.L - g.l1))]} p2={[X(g.L), Y(0)]}
      konum={ust - 14} deger={g.l1} tol={params.toll1} anma={g.l1} {...ek} />);
  }
  // Matkap ucu: takımın tepesinden 1. çapın başladığı yere kadar uç konisinin boyu (çap ve uç açısından hesaplanır;
  // başka ölçülerden türediği için referans ölçü, parantezli). Havşalıda 1. kademe boyuyla aynı satırda zincir.
  const ucKonisi = ucKonisiBoyu(g, params);
  if (ucKonisi && params.showDiml1 !== false) {
    e.push(<Olcu key="dUcKoni" id="dUcKoni" yon="yatay" p1={[X(g.L - ucKonisi.boy), Y(ucKonisi.r)]} p2={[X(g.L), Y(0)]}
      konum={ust - (stepdrill && !toplamOlcu ? 14 : 7)} deger={Math.round(ucKonisi.boy * 100) / 100} referans {...ek} />);
  }
  if (stepdrill) {
    g.kademeler.forEach((kd, i) => {
      if (params.showDiml1 !== false && !toplamOlcu) {
        e.push(<Olcu key={`dst${i}`} id={`dst${i}`} yon="yatay" p1={[X(kd.sol), Y(yaricapAt(g, kd.sol))]} p2={[X(kd.sag), Y(yaricapAt(g, kd.sag))]}
          konum={ust - 7} deger={kd.len} tol={kd.tolLen} anma={kd.len} {...ek} />);
      }
      if (params.showDimD && !(toplamOlcu && i > 0 && Math.abs(kd.dia - g.d) < 1e-9)) {
        const xm = (kd.sol + kd.sag - kd.gecisBoyu) / 2;
        e.push(<Olcu key={`dsd${i}`} id={`dsd${i}`} yon="dikey" p1={[X(xm), Y(kd.dia / 2)]} p2={[X(xm), Y(-kd.dia / 2)]}
          konum={X(xm)} deger={kd.dia} onEk="⌀" tol={kd.tolDia} anma={kd.dia} {...ek} />);
      }
    });
  }

  // Özel takım: her yatay parçanın boyu ve çapı, eğimli parçaların eksenle açısı
  if (ozel) {
    const nk = g.noktalar || [];
    for (let i = 0; i < nk.length - 1; i++) {
      const a = nk[i], b = nk[i + 1];
      const dx = b.x - a.x, dr = b.r - a.r;
      if (dx < 0.2) continue;
      if (Math.abs(dr) < 1e-9 && a.r > 0) {
        if (params.showDiml1 !== false) {
          e.push(<Olcu key={`oy${i}`} id={`oy${i}`} yon="yatay" p1={[X(a.x), Y(a.r)]} p2={[X(b.x), Y(b.r)]} konum={ust - 7} deger={dx} {...ek} />);
        }
        if (params.showDimD && a.x > 1e-9) {   // ilk parça sap: çapı soldaki d ölçüsünde
          const xm = (a.x + b.x) / 2;
          e.push(<Olcu key={`od${i}`} id={`od${i}`} yon="dikey" p1={[X(xm), Y(a.r)]} p2={[X(xm), Y(-a.r)]} konum={X(xm)} deger={2 * a.r} onEk="⌀" {...ek} />);
        }
      } else if (Math.abs(dr) > 1e-9 && params.showDimAngles) {
        const ac = (Math.atan2(Math.abs(dr), dx) * 180) / Math.PI;
        const hx = X((a.x + b.x) / 2), hy = Y((a.r + b.r) / 2);
        e.push(<Kilavuz key={`oa${i}`} id={`oa${i}`} hedef={[hx, hy]} dirsek={[hx + 8, ust - 12 - (i % 2) * 5]} metin={`${fmt(Math.round(ac * 10) / 10)}°`} {...ek} />);
      }
    }
  }

  // Sağ: kesici çap (D) — kademelide kademelerde gösterilir
  if (!stepdrill && !ozel && params.showDimD) {
    const xd = xCapta(g, hD);
    e.push(<Olcu key="dD" id="dD" alan="D" yon="dikey" p1={[X(xd), Y(hD)]} p2={[X(xd), Y(-hD)]}
      konum={X(g.L) + (g.konik ? 20 : 10)} deger={g.D} onEk="⌀" tol={params.tolD} anma={g.D} {...ek} />);
  }
  if (g.konik && params.showDimD) {
    const rt = params.tipD / 2;
    e.push(<Olcu key="dTip" id="dTip" alan="tipD" yon="dikey" p1={[X(g.L), Y(rt)]} p2={[X(g.L), Y(-rt)]}
      konum={X(g.L) + 10} deger={params.tipD} onEk="⌀" tol={params.tolTip} anma={params.tipD} {...ek} />);
  }
  // Sol: sap çapı (d)
  if (params.showDimd) {
    e.push(<Olcu key="dd" id="dd" alan="d" yon="dikey" p1={[X(0), Y(hd)]} p2={[X(0), Y(-hd)]}
      konum={X(0) - 10} deger={g.d} onEk="⌀" tol={params.told} anma={g.d} {...ek} />);
  }
  // Boğaz çapı
  if (g.l2 > 0 && params.showDimNeck) {
    const xm = (g.x.gecisSonu + g.x.boyunSonu) / 2;
    e.push(<Olcu key="dN" id="dN" alan="neckDia" yon="dikey" p1={[X(xm), Y(hN)]} p2={[X(xm), Y(-hN)]}
      konum={X(xm)} deger={g.nD} onEk="⌀" tol={params.tolNeck} anma={g.nD} {...ek} />);
  }

  // Sap düzlüğü (HB/HE): uzunluk ölçüsü ve tip etiketi
  if (g.sapDuz && params.showDimd) {
    const dz = g.sapDuz;
    const yDuz = hd - dz.derinlik;
    e.push(<Olcu key="dDuz" id="dDuz" yon="yatay" p1={[X(0), Y(yDuz)]} p2={[X(dz.uzunluk), Y(dz.tip === "HB" ? yDuz : hd)]}
      konum={ust - 7} deger={dz.uzunluk} {...ek} />);
    const etiket = `DIN 6535-${dz.tip}${dz.oto.derinlik ? "" : ` · t ${fmt(dz.derinlik)}`}`;
    e.push(<Kilavuz key="aDuz" id="aDuz" hedef={[X(dz.uzunluk * 0.12), Y(dz.tip === "HB" ? yDuz : hd - dz.derinlik * 0.88)]}
      dirsek={[X(dz.uzunluk * 0.12), ust - 13]} metin={etiket} {...ek} />);
  }
  // Konik rayba: koniklik oranı
  if (g.konik && params.showDimAngles) {
    const xm = (g.x.boyunSonu + g.L) / 2;
    e.push(<Kilavuz key="aKonik" id="aKonik" hedef={[X(xm), Y((hD + params.tipD / 2) / 2)]} dirsek={[X(xm), ust - 6]}
      metin={`${mt(params, "konik")} 1:${fmt(Math.round(g.konik.bolen * 100) / 100)}`} {...ek} />);
  }

  // ── AÇILAR VE ÖZEL ÖLÇÜLER (kılavuz çizgili) ──
  if (params.showDimAngles) {
    // Geçiş açısı
    if (g.l2 > 0 && g.gecisBoyu > 0) {
      const xm = (g.x.sapSonu + g.x.gecisSonu) / 2;
      const hx = X(xm), hy = Y((hd + hN) / 2);
      e.push(<Kilavuz key="aNeck" id="aNeck" hedef={[hx, hy]} dirsek={[hx - 12, ust - 5]} metin={`${fmt(params.neckAngle)}°`} {...ek} />);
    }
    // Matkap uç açısı
    if (g.tip === "drill") {
      const ucBoyu = hD / Math.tan(((params.pointAngle || 140) / 2) * DEG);
      const hx = X(g.L - ucBoyu / 2), hy = Y(hD / 2);
      e.push(<Kilavuz key="aPoint" id="aPoint" hedef={[hx, hy]} dirsek={[hx, ust - (params.showDiml1 !== false ? 14 : 6)]} metin={`${fmt(params.pointAngle || 140)}°`} {...ek} />);
    }
    // Kademeli matkap: uç ve geçiş açıları
    if (stepdrill) {
      g.kademeler.forEach((kd, i) => {
        const r = kd.dia / 2;
        const rr = i === 0 ? r / 2 : (r + g.kademeler[i - 1].dia / 2) / 2;
        const xm = kd.sag - kd.gecisBoyu / 2;
        const hx = X(xm);
        if (i === 0) e.push(<Kilavuz key={`aS${i}`} id={`aS${i}`} hedef={[hx, Y(rr)]} dirsek={[hx, ust - (params.showDiml1 !== false ? 21 : 13)]} metin={`${fmt(kd.angle)}°`} {...ek} />);
        else e.push(<Kilavuz key={`aS${i}`} id={`aS${i}`} hedef={[hx, Y(-rr)]} dirsek={[hx, alt + 5]} metin={`${fmt(kd.angle)}°`} {...ek} />);
      });
    }
    // Köşe radyüsü
    if (g.tip === "bullnose" && params.rCorner > 0) {
      const r = params.rCorner;
      const cx = g.L - r, cy = hD - r;
      const hx = X(cx + r * Math.cos(Math.PI / 4)), hy = Y(cy + r * Math.sin(Math.PI / 4));
      e.push(<Kilavuz key="aR" id="aR" hedef={[hx, hy]} dirsek={[X(g.L) + 12, ust - 6]} metin={`R${fmt(r)}`} {...ek} />);
    }
    // Pah
    if ((g.tip === "chamfer" || g.tip === "reamer" || g.tip === "flat") && params.chamferSize > 0) {
      const c = params.chamferSize;
      const hx = X(g.L - c / 2), hy = Y(hD - c / 2);
      e.push(<Kilavuz key="aC" id="aC" hedef={[hx, hy]} dirsek={[X(g.L) + 12, ust - 6]} metin={`${fmt(c)}×45°`} {...ek} />);
    }
  }

  // Helis açısı (olukların üzerinden)
  if (params.showDimHelix && yollar.length && params.helix > 0) {
    const xh = k > 0 ? Math.min(g.x.boyunSonu + 0.45 / k, g.L - 0.1) : g.x.boyunSonu + 0.3 * g.l1;
    const yonH = params.helixHand === "Sol" ? 1 : -1;
    const yh = hD * Math.sin(yonH * 0.45); // oluk 0: φ = yon·k·(x−x0) → bu x'te φ = yon·0,45
    const hx = X(xh), hy = Y(k > 0 ? yh : hD * Math.sin(Math.PI / 12));
    e.push(<Kilavuz key="aHelix" id="aHelix" hedef={[hx, hy]} dirsek={[hx, ust - 5]}
      metin={`${fmt(params.helix)}° ${yonMetni(params, params.helixHand)}`} {...ek} />);
  }

  return <g>{e}</g>;
}
