import { Ikon } from "./Ikon";
import { olcekYaz } from "../drawing/sayfaDuzeni";

const saat = (d) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

/** Çizim alanının altındaki durum çubuğu: kayıt, ölçek, geometri uyarıları, yazı çakışması. */
export function DurumCubugu({ params, duzen, kayitZamani, uyariSayisi, cakisma, isaretAcik, onIsaret }) {
  return (
    <div className="durum-cubugu" role="status">
      <span className="dc-oge" title="Çalışma bu tarayıcıda otomatik kaydedilir">
        <Ikon ad={kayitZamani ? "kaydet" : "dosya"} boyut={14} />
        <span className="dc-yazi">{kayitZamani ? `Kaydedildi ${saat(kayitZamani)}` : "Kaydedilmedi"}</span>
      </span>
      <span className="dc-oge"><b>{olcekYaz(duzen.yan.olcek)}</b> · {duzen.kagit.ad}</span>
      <span className="dc-oge dc-takim">⌀{params.D}×{params.L} mm · {params.z}Z</span>
      {uyariSayisi > 0
        ? <span className="dc-oge uyari" title="Takım sekmesinde ayrıntıları görün"><Ikon ad="uyari" boyut={14} />{uyariSayisi} geometri uyarısı</span>
        : <span className="dc-oge tamam"><Ikon ad="tik" boyut={14} /><span className="dc-yazi">Geometri uygun</span></span>}
      {cakisma.length > 0
        ? (
          <button type="button" className={`dc-oge dc-dugme cakisma${isaretAcik ? " acik" : ""}`} onClick={onIsaret}
            title={`${cakisma.slice(0, 6).map((c) => `“${c.a.metin}” ↔ “${c.b.metin}”`).join("\n")}\n\nTıklayınca çizimdeki işaretler gizlenir/gösterilir. Çakışan yazıyı tutup sürükleyin.`}>
            <Ikon ad="cakisma" boyut={14} />{cakisma.length} yazı çakışması
          </button>
        )
        : <span className="dc-oge tamam"><Ikon ad="tik" boyut={14} /><span className="dc-yazi">Yazı çakışması yok</span></span>}
      <span className="dc-bosluk" />
      <span className="dc-ipucu">Ölçüye çift tıklayın: alanı açılır · Ctrl+Z geri al · Ctrl+S kaydet</span>
    </div>
  );
}
