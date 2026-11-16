import { useEffect, useState } from "react";
import { Grup } from "./inputs";
import { kutuphaneKaydi } from "../io/dosya";
import { takimProfili } from "../geometry/profil";
import * as ortak from "../io/ortakKlasor";

const ANAHTAR = "mihenk-lib";

function oku() {
  try { const v = JSON.parse(localStorage.getItem(ANAHTAR) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function yaz(liste) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(liste)); return true; } catch { return false; }
}

/** Takım kütüphanesi: bu tarayıcıda saklanır; JSON olarak dışa/içe aktarılabilir. */
export function LibraryPanel({ params, dimOff, yukle }) {
  const [lib, setLib] = useState(oku);
  const [ara, setAra] = useState("");
  const [mesaj, setMesaj] = useState("");

  const kaydet = (yeni) => {
    if (yaz(yeni)) { setLib(yeni); return true; }
    setMesaj("Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı.");
    return false;
  };
  const filtre = ara.trim().toLowerCase();
  const gorunen = filtre
    ? lib.filter((t) => `${t.toolName || ""} ${t.material || ""} ${t.coating || ""}`.toLowerCase().includes(filtre))
    : lib;
  // ── Ortak klasör (File System Access API: yalnız Chrome / Edge) ──
  const [klasor, setKlasor] = useState(null);          // izinli klasör tutamacı
  const [bekleyen, setBekleyen] = useState(null);      // önceki oturumdan kalan, izin bekleyen klasör
  const [dosyalar, setDosyalar] = useState([]);
  const [ortakMesaj, setOrtakMesaj] = useState("");
  const destek = ortak.destekleniyor();
  const hata = (e) => setOrtakMesaj(e?.name === "AbortError" ? "" : `Klasör işlemi başarısız: ${e?.message || e}`);
  const tazele = async (k = klasor) => { try { setDosyalar(await ortak.listele(k)); } catch (e) { hata(e); } };

  useEffect(() => {
    if (!destek) return;
    ortak.tutamacOku().then(async (k) => {
      if (!k) return;
      if (await ortak.izinVarMi(k)) { setKlasor(k); setDosyalar(await ortak.listele(k).catch(() => [])); } else setBekleyen(k);
    });
  }, [destek]);

  const klasorSec = async () => {
    try {
      const k = await window.showDirectoryPicker({ mode: "readwrite" });
      await ortak.tutamacKaydet(k);
      setKlasor(k); setBekleyen(null); setOrtakMesaj(""); await tazele(k);
    } catch (e) { hata(e); }
  };
  const yenidenBagla = async () => {
    try { if (await ortak.izinVarMi(bekleyen, true)) { setKlasor(bekleyen); setBekleyen(null); setOrtakMesaj(""); await tazele(bekleyen); } else setOrtakMesaj("İzin verilmedi."); } catch (e) { hata(e); }
  };
  const klasoreKaydet = async () => {
    try {
      const ad = ortak.dosyaAdiOlustur(params.toolName);
      if (await ortak.varMi(klasor, ad) && !window.confirm(`"${ad}" klasörde zaten var. Üzerine yazılsın mı? (Başkasının güncel çalışması olabilir.)`)) return;
      await ortak.yaz(klasor, params, dimOff);
      setOrtakMesaj(`"${ad}" klasöre kaydedildi.`); await tazele();
    } catch (e) { hata(e); }
  };
  const klasordenAc = async (d) => {
    try {
      const r = await ortak.oku(d.tutamac);
      yukle({ ...r.params, dimOff: r.dimOff });
      setOrtakMesaj(`"${d.ad}" açıldı.`);
    } catch (e) { setOrtakMesaj(e.message); }
  };
  const klasoruBirak = async () => { await ortak.tutamacSil(); setKlasor(null); setBekleyen(null); setDosyalar([]); setOrtakMesaj(""); };

  const adVar = lib.some((t) => t.toolName === (params.toolName || "İsimsiz"));

  return (
    <>
      <Grup baslik="Geçerli takım">
        <button className="btn birincil tam" onClick={() => {
          const ad = params.toolName || "İsimsiz";
          const kayit = kutuphaneKaydi(params, dimOff, ad);
          const i = lib.findIndex((t) => t.toolName === ad);
          if (kaydet(i >= 0 ? lib.map((t, j) => (j === i ? kayit : t)) : [...lib, kayit])) setMesaj(i >= 0 ? `"${ad}" güncellendi.` : `"${ad}" kütüphaneye eklendi.`);
        }}>
          {adVar ? "Kütüphanede güncelle" : "Kütüphaneye kaydet"}
        </button>
        <div className="ipucu">{params.toolName || "İsimsiz"}{adVar ? " · aynı adlı kayıt güncellenir" : ""}</div>
        {mesaj && <div className="ipucu" style={{ color: "var(--accent2)" }}>{mesaj}</div>}
      </Grup>

      <Grup baslik="Kayıtlı takımlar" sag={`${lib.length} kayıt`}>
        <input type="search" className="alan" style={{ marginBottom: 8 }} placeholder="Ad, malzeme ya da kaplama ara…" value={ara} onChange={(e) => setAra(e.target.value)} />
        <div className="liste">
          {gorunen.length === 0 && (
            <div className="ipucu" style={{ textAlign: "center", padding: 14 }}>
              {lib.length === 0 ? "Henüz kayıt yok. Bir takım çizip yukarıdan kaydedin." : "Eşleşen kayıt yok."}
            </div>
          )}
          {gorunen.map((t) => (
            <div key={t.toolName} className="liste-oge" onClick={() => yukle(t)} title="Yüklemek için tıklayın (geçerli resmin yerini alır)">
              <div className="govde">
                <div className="ad">{t.toolName}</div>
                <div className="alt">⌀{+takimProfili(t).D.toFixed(3)}×{+takimProfili(t).L.toFixed(3)} · {t.z}Z{t.material ? ` · ${t.material}` : ""}</div>
              </div>
              <button className="btn kucuk tehlike" aria-label={`${t.toolName} kaydını sil`} onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`"${t.toolName}" kütüphaneden silinsin mi?`)) kaydet(lib.filter((x) => x.toolName !== t.toolName));
              }}>Sil</button>
            </div>
          ))}
        </div>
      </Grup>

      <Grup baslik="Ortak klasör" sag={klasor ? klasor.name : "bağlı değil"}>
        {!destek && <div className="ipucu">Bu tarayıcı klasör bağlamayı desteklemiyor. Chrome ya da Edge kullanın; ya da aşağıdan dışa/içe aktarın.</div>}
        {destek && !klasor && !bekleyen && (
          <>
            <button className="btn tam" onClick={klasorSec}>Klasör bağla…</button>
            <div className="ipucu">Ağ sürücüsü, OneDrive ya da Dropbox içindeki bir klasör seçin: takımlar orada <b>.mhk.json</b> dosyaları olur, klasöre erişen herkes aynı kütüphaneyi görür. Sunucu gerekmez; dosyalar bilgisayarınızda kalır.</div>
          </>
        )}
        {destek && bekleyen && (
          <>
            <button className="btn tam" onClick={yenidenBagla}>“{bekleyen.name}” klasörünü yeniden bağla</button>
            <div className="ipucu">Önceki oturumdaki klasör; tarayıcı izni yeniden ister. <button className="btn kucuk hayalet" onClick={klasoruBirak}>Bırak</button></div>
          </>
        )}
        {destek && klasor && (
          <>
            <div className="btn-satir" style={{ marginBottom: 8 }}>
              <button className="btn birincil" onClick={klasoreKaydet}>Geçerli takımı kaydet</button>
              <button className="btn" onClick={() => tazele()}>Yenile</button>
            </div>
            <div className="liste">
              {dosyalar.length === 0 && <div className="ipucu" style={{ textAlign: "center", padding: 12 }}>Klasörde .mhk.json dosyası yok.</div>}
              {dosyalar.map((d) => (
                <div key={d.ad} className="liste-oge" onClick={() => klasordenAc(d)} title="Açmak için tıklayın (geçerli resmin yerini alır)">
                  <div className="govde"><div className="ad">{d.ad.replace(/\.mhk\.json$/i, "")}</div></div>
                </div>
              ))}
            </div>
            <button className="btn kucuk hayalet" style={{ marginTop: 8 }} onClick={klasoruBirak}>Klasörü bırak</button>
          </>
        )}
        {ortakMesaj && <div className="ipucu" style={{ color: "var(--accent2)" }}>{ortakMesaj}</div>}
      </Grup>

      <Grup baslik="Yedekle">
        <div className="btn-satir">
          <button className="btn" disabled={lib.length === 0} onClick={() => {
            const b = new Blob(["﻿" + JSON.stringify(lib, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = `mihenk-kutuphane-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          }}>Dışa aktar</button>
          <button className="btn" onClick={() => {
            const inp = document.createElement("input");
            inp.type = "file"; inp.accept = ".json";
            inp.onchange = (e) => {
              const f = e.target.files[0]; if (!f) return;
              const r = new FileReader();
              r.onload = (ev) => {
                try {
                  const veri = JSON.parse(String(ev.target.result).replace(/^﻿/, ""));
                  if (!Array.isArray(veri)) throw new Error("liste değil");
                  const birlesik = [...lib];
                  let yeni = 0, guncel = 0;
                  for (const t of veri) {
                    if (!t || typeof t.toolName !== "string") continue;
                    const i = birlesik.findIndex((x) => x.toolName === t.toolName);
                    if (i >= 0) { birlesik[i] = t; guncel++; } else { birlesik.push(t); yeni++; }
                  }
                  if (kaydet(birlesik)) setMesaj(`İçe aktarıldı: ${yeni} yeni, ${guncel} güncellendi.`);
                } catch { setMesaj("Dosya okunamadı: geçerli bir kütüphane JSON'u değil."); }
              };
              r.readAsText(f);
            };
            inp.click();
          }}>İçe aktar</button>
        </div>
        <div className="ipucu">Kütüphane bu tarayıcıda saklanır. Tarayıcı verisini silmeden önce dışa aktarıp yedekleyin.</div>
      </Grup>
    </>
  );
}
