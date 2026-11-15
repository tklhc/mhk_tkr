// Diş profili (uçtan kesit, bir dişin kesici kenarı çevresi). İş emrinden gelen değerlerle:
//   dpKesme   kesme açısı γ (talaş yüzeyinin radyal çizgiyle yaptığı açı, + = kesici kenar önde)
//   dpSy1Gen, dpSy1Aci   1. serbest yüzeyin genişliği (mm) ve açısı (°)
//   dpSy2Gen, dpSy2Aci   2. serbest yüzeyin genişliği (mm) ve açısı (°) — isteğe bağlı
// Serbest yüzey açıları, kesici kenarın teğetine göre ölçülür. Çizim şematiktir: kanal arka duvarı ve
// kanal tabanı gerçek taşlama profili değildir; yalnız verilen değerler ölçeklidir.
//
// Yerel koordinat (u, v): başlangıç kesici kenar P = (0, 0); u = teğet boyunca, topuk (arka) yönüne;
// v = takım merkezine doğru (içeri). Takım merkezi (0, R).

const DEG = Math.PI / 180;

export const DIS_ALANLARI = ["dpKesme", "dpSy1Gen", "dpSy1Aci", "dpSy2Gen", "dpSy2Aci"];

/** Girilen değerlerden hiçbiri dolu mu? */
export const disVerisiVar = (p) => DIS_ALANLARI.some((k) => +p[k] > 0 || +p[k] < 0);

/** Çizim için gereken en az veri: kesme açısı + 1. serbest yüzey (genişlik ve açı). */
export const disProfiliYeterli = (p) => !!(+p.dpKesme) && +p.dpSy1Gen > 0 && +p.dpSy1Aci > 0;

/**
 * @returns {null | {
 *   R:number, rc:number, pitch:number, gamma:number, a1:number, a2:number, w1:number, w2:number, ikinci:boolean,
 *   A:number[], B:number[], Ff:number[], H:number[], FfSonraki:number[], k:number, sigmiyor:boolean }}
 */
export function disProfiliGeometri(params, g) {
  const R = g.D / 2, rc = (+params.dCore || 0) / 2, z = Math.round(+params.z || 0);
  if (!disProfiliYeterli(params) || !(R > 0) || !(rc > 0) || !(rc < R) || !(z >= 2)) return null;
  const gamma = +params.dpKesme * DEG, a1 = +params.dpSy1Aci * DEG, a2 = (+params.dpSy2Aci || 0) * DEG;
  const w1 = +params.dpSy1Gen, w2 = +params.dpSy2Gen || 0;
  if (!(Math.abs(gamma) < 80 * DEG) || !(a1 < 60 * DEG) || a2 >= 60 * DEG) return null;
  const ikinci = w2 > 0 && a2 > 0;
  const pitch = (2 * Math.PI) / z;
  const aciB = (q) => Math.atan2(q[0], R - q[1]);        // merkezden bakınca P yönünden sapma
  const dondur = (k) => {
    const A = [w1 * k * Math.cos(a1), w1 * k * Math.sin(a1)];
    const B = ikinci ? [A[0] + w2 * k * Math.cos(a2), A[1] + w2 * k * Math.sin(a2)] : A;
    return { A, B };
  };
  // Serbest yüzeyler diş aralığının ~%55'ine sığmalı; sığmazsa çizim kısaltılır (gerçek değerler yazılı kalır)
  let k = 1, { A, B } = dondur(1);
  const sinir = 0.55 * pitch;
  let sigmiyor = false;
  if (aciB(B) > sinir) {
    sigmiyor = true;
    for (let i = 0; i < 4; i++) { k *= sinir / aciB(B); ({ A, B } = dondur(k)); }
  }
  // Talaş yüzeyi: P'den içeri, radyalle γ açısıyla; çekirdek dairesiyle kesişimi
  const disk = R * R * Math.cos(gamma) ** 2 - R * R + rc * rc;
  if (disk < 0) return null;
  const t = R * Math.cos(gamma) - Math.sqrt(disk);
  const Ff = [t * Math.sin(gamma), t * Math.cos(gamma)];
  // Topuk: B'den çekirdeğe inen arka duvar; sonraki dişin talaş yüzeyi ayağı bir diş aralığı ileride
  const psiH = aciB(B) + 0.08 * pitch;
  const H = [rc * Math.sin(psiH), R - rc * Math.cos(psiH)];
  const psiF = Math.atan2(Ff[0], R - Ff[1]) + pitch;
  const FfSonraki = [rc * Math.sin(psiF), R - rc * Math.cos(psiF)];
  return { R, rc, pitch, gamma, a1, a2, w1, w2, ikinci, A, B, Ff, H, FfSonraki, k, sigmiyor };
}

/** Panelde gösterilecek doğrulama uyarıları ({alan, mesaj}). Veri hiç girilmemişse uyarı yok. */
export function disProfiliHatalari(params, g) {
  const h = [];
  if (!disVerisiVar(params)) return h;
  const ekle = (alan, mesaj) => h.push({ alan, mesaj });
  if (!disProfiliYeterli(params)) ekle("dpKesme", "Diş profili detayı için kesme açısı ve 1. serbest yüzey (genişlik + açı) girilmeli.");
  if (+params.dpSy2Gen > 0 && !(+params.dpSy2Aci > 0)) ekle("dpSy2Aci", "2. serbest yüzey genişliği girildi ama açısı yok.");
  if (+params.dpSy2Aci > 0 && !(+params.dpSy2Gen > 0)) ekle("dpSy2Gen", "2. serbest yüzey açısı girildi ama genişliği yok.");
  if (!(+params.dCore > 0) && disProfiliYeterli(params)) ekle("dCore", "Diş profili detayı için çekirdek çapı gerekli.");
  const gm = disProfiliGeometri(params, g);
  if (gm?.sigmiyor) {
    ekle("dpSy1Gen", `Serbest yüzey genişlikleri toplamı (${+(gm.w1 + gm.w2).toFixed(3)} mm) diş aralığına (${+(gm.R * gm.pitch).toFixed(2)} mm) sığmıyor; detay kısaltılarak çizildi.`);
  }
  if (disProfiliYeterli(params) && +params.dCore > 0 && !gm) ekle("dpKesme", "Diş profili detayı çizilemedi: kesme açısı, serbest yüzey açıları ya da çekirdek çapı geometriyle uyuşmuyor.");
  return h;
}
