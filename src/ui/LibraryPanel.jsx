import { useState } from "react";
import { Grup } from "./inputs";
import { kutuphaneKaydi } from "../io/dosya";
import { takimProfili } from "../geometry/profil";

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
