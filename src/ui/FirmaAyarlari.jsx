import { useEffect, useRef, useState } from "react";
import { FIRMA, FIRMA_VARSAYILAN, LOGO_AZAMI, firmaKaydet, firmaSifirla } from "../config";
import { logoAl } from "../assets/images";
import { Ikon } from "./Ikon";
import { Metin } from "./inputs";

/** Resmi bir en çok `kenar` pikselli PNG'ye indirip data adresi verir (büyük logolar taslağı şişirmesin). */
function logoKucult(dosya, kenar = 600) {
  return new Promise((coz, reddet) => {
    if (dosya.type === "image/svg+xml") {
      const r = new FileReader();
      r.onload = () => coz(String(r.result));
      r.onerror = () => reddet(new Error("Dosya okunamadı."));
      r.readAsDataURL(dosya);
      return;
    }
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => {
      const o = Math.min(1, kenar / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * o)); c.height = Math.max(1, Math.round(img.height * o));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      coz(c.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reddet(new Error("Görsel okunamadı: PNG, JPG ya da SVG seçin.")); };
    img.src = url;
  });
}

/** Firma ayarları: antet ve katalogta görünen ad, çizen, iletişim bilgileri ve logo. */
export function FirmaAyarlari({ kapat, kaydedildi }) {
  const [f, setF] = useState({ ...FIRMA });
  const [mesaj, setMesaj] = useState("");
  const dosya = useRef(null);
  const u = (k, v) => setF((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [kapat]);

  const logoSec = async (e) => {
    const d = e.target.files[0]; e.target.value = "";
    if (!d) return;
    try {
      const adres = await logoKucult(d);
      if (adres.length > LOGO_AZAMI) { setMesaj("Logo çok büyük (en çok ~300 KB). Daha küçük bir dosya seçin."); return; }
      u("logo", adres); setMesaj("");
    } catch (err) { setMesaj(err.message); }
  };
  const kaydet = () => {
    if (!firmaKaydet(f)) setMesaj("Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı. Ayar yalnız bu oturumda geçerli.");
    kaydedildi();
    kapat();
  };
  const varsayilan = () => { firmaSifirla(); setF({ ...FIRMA_VARSAYILAN }); kaydedildi(); setMesaj("Varsayılan MİHENK bilgilerine dönüldü."); };
  const onizleme = f.logo || logoAl();

  return (
    <div className="modal-perde" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Firma ayarları">
        <div className="modal-ust">
          <b>Firma ayarları</b>
          <button className="btn kucuk ikon hayalet" onClick={kapat} aria-label="Kapat"><Ikon ad="kapat" boyut={16} /></button>
        </div>
        <div className="modal-govde">
          <div className="ipucu" style={{ marginBottom: 12 }}>Bu bilgiler antette ve katalog sayfalarında çıkar. Bu tarayıcıda saklanır; başka bilgisayarda ayrıca girilir.</div>
          <Metin label="Firma adı (antet)" value={f.ad} onChange={(v) => u("ad", v)} />
          <Metin label="Varsayılan çizen" value={f.cizen} onChange={(v) => u("cizen", v)} placeholder="Çizen alanı boşsa bu yazılır" />
          <div className="iki">
            <Metin label="Telefon" value={f.tel} onChange={(v) => u("tel", v)} />
            <Metin label="E-posta" value={f.eposta} onChange={(v) => u("eposta", v)} />
          </div>
          <Metin label="Web adresi" value={f.web} onChange={(v) => u("web", v)} />
          <div className="grup-baslik" style={{ marginTop: 12 }}>Logo</div>
          <div className="firma-logo">
            <div className="firma-logo-kutu"><img src={onizleme} alt="Logo önizleme" /></div>
            <div className="btn-satir" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <button className="btn" onClick={() => dosya.current?.click()}>Logo yükle…</button>
              <button className="btn hayalet" disabled={!f.logo} onClick={() => u("logo", "")}>Yerleşik logoya dön</button>
            </div>
            <input ref={dosya} type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: "none" }} onChange={logoSec} />
          </div>
          <div className="ipucu">PNG, JPG ya da SVG; arka planı şeffaf yatay bir logo en iyisidir.</div>
          {mesaj && <div className="ipucu" style={{ color: "var(--accent2)", marginTop: 8 }}>{mesaj}</div>}
        </div>
        <div className="modal-alt">
          <button className="btn hayalet" style={{ marginRight: "auto" }} onClick={varsayilan}>Varsayılana dön</button>
          <button className="btn hayalet" onClick={kapat}>Vazgeç</button>
          <button className="btn birincil" onClick={kaydet}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}
