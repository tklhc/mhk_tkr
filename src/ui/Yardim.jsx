import { useEffect } from "react";
import { Ikon } from "./Ikon";

const KISAYOLLAR = [
  ["Ctrl + Z", "Geri al"],
  ["Ctrl + Y  ·  Ctrl + Shift + Z", "Yinele"],
  ["Ctrl + S", "Dosya olarak kaydet (.mhk.json)"],
  ["Ctrl + O", "Dosya aç"],
  ["Ctrl + tekerlek", "Çizimi yakınlaştır / uzaklaştır"],
  ["↑  ↓  (sayı alanında)", "Değeri değiştir · Shift ×10 · Alt ×0,1"],
  ["Esc", "Açık menüyü ya da pencereyi kapat"],
  ["?", "Bu pencereyi aç"],
];

const IPUCLARI = [
  ["Ölçüye çift tıklayın", "Takım sekmesinde ilgili alan açılır ve seçili gelir."],
  ["Görünüşleri sürükleyin", "Takım, detay, uçtan görünüş, kesit ve diş profili detayı tutulup taşınır. Ölçü ve etiketler ayrıca kendi başlarına kayar. Araç çubuğundaki sıfırlama düğmesi hepsini yerine koyar."],
  ["Çizim türü", "Müşteri çiziminde teknik veri tablosu, iş emri çiziminde üretim özellikleri tablosu (ve diş profili detayı) çıkar. Antet ve alt kutular iki türde de aynı ölçüdedir."],
  ["Yazı çakışması uyarısı", "Altta kırmızı çıkarsa iki yazı üst üste biniyordur; çizimde işaretlenir. Birini tutup sürükleyin. İşaretler çıktıya girmez."],
  ["PDF", "“PDF indir” sayfayı kâğıt boyutunda (A4 = 297×210 mm, 300 dpi) verir; yazdırırken ölçeği yüzde 100 bırakın."],
];

/** Kısayollar ve ipuçları penceresi. */
export function Yardim({ kapat }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") kapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [kapat]);
  return (
    <div className="modal-perde" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Kısayollar ve ipuçları">
        <div className="modal-ust">
          <b>Kısayollar ve ipuçları</b>
          <button className="btn kucuk ikon hayalet" onClick={kapat} aria-label="Kapat"><Ikon ad="kapat" boyut={16} /></button>
        </div>
        <div className="modal-govde">
          <div className="grup-baslik" style={{ marginBottom: 6 }}>Kısayollar</div>
          <div className="ie-tablo" style={{ marginBottom: 18 }}>
            {KISAYOLLAR.map(([tus, ne]) => (
              <div key={tus} className="ie-satir" style={{ gridTemplateColumns: "1.2fr 1.6fr" }}>
                <b><kbd className="tus">{tus}</kbd></b><span>{ne}</span>
              </div>
            ))}
          </div>
          <div className="grup-baslik" style={{ marginBottom: 6 }}>İpuçları</div>
          <div className="ie-tablo">
            {IPUCLARI.map(([baslik, metin]) => (
              <div key={baslik} className="ie-satir" style={{ gridTemplateColumns: "1fr 2fr" }}>
                <b style={{ fontFamily: "var(--ui)" }}>{baslik}</b><span>{metin}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-alt"><button className="btn birincil" onClick={kapat}>Tamam</button></div>
      </div>
    </div>
  );
}
