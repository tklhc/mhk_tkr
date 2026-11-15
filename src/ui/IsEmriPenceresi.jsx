import { useMemo, useRef, useState } from "react";
import { isEmriMetniCoz, isEmriParametreleri } from "../io/isEmri";
import { takimProfili } from "../geometry/profil";
import { TOOL_TYPES } from "../constants";

const UZANTI_RESIM = /\.(png|jpe?g|bmp|gif|webp|tiff?)$/i;

/**
 * İş emrinden resim çizme penceresi: 1) PDF yükle ya da metin yapıştır,
 * 2) okunan değerleri, uyarıları ve geometri hatalarını gör, onayla.
 */
export function IsEmriPenceresi({ mevcut, kapat, uygula, baslangicMetni = "" }) {
  // Bağlantıyla (ÜTS köprüsü) gelen yazı varsa doğrudan okunan değerler gösterilir; yine de kullanıcı onaylar
  const [adim, setAdim] = useState(baslangicMetni ? "onay" : "gir");
  const [metin, setMetin] = useState(baslangicMetni);
  const [hata, setHata] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const [dosya, setDosya] = useState("");
  const girdi = useRef(null);

  const onizleme = useMemo(() => {
    if (adim !== "onay") return null;
    const sonuc = isEmriMetniCoz(metin);
    const { params, uyarilar } = isEmriParametreleri(sonuc, mevcut);
    return { sonuc, params, uyarilar, hatalar: takimProfili(params).hatalar };
  }, [adim, metin, mevcut]);

  const dosyaOku = async (f) => {
    setHata("");
    if (!f) return;
    if (f.type.startsWith("image/") || UZANTI_RESIM.test(f.name)) {
      setHata("Resim dosyaları okunamıyor: yazıdan sayı çıkarmak (OCR) yanlış ölçü riski taşır. İş emrini ÜTS'den PDF olarak kaydedip yükleyin (Yazdır → PDF olarak kaydet) ya da yazısını kopyalayıp aşağıya yapıştırın.");
      return;
    }
    setMesgul(true);
    setDosya(f.name);
    try {
      if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
        const { pdfMetni } = await import("../io/isEmriPdf");
        setMetin(await pdfMetni(await f.arrayBuffer()));
      } else {
        setMetin(await f.text());
      }
    } catch (e) {
      setHata(`Dosya okunamadı: ${e.message || e}`);
    } finally {
      setMesgul(false);
    }
  };

  return (
    <div className="modal-perde" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label="İş emrinden resim çiz"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); dosyaOku(e.dataTransfer.files?.[0]); }}>
        <div className="modal-ust">
          <b>İş emrinden resim çiz</b>
          <button className="btn kucuk ikon hayalet" onClick={kapat} aria-label="Kapat">✕</button>
        </div>

        {adim === "gir" && (
          <div className="modal-govde">
            <p className="ipucu" style={{ marginTop: 0 }}>
              ÜTS iş emri kağıdını <b>PDF olarak kaydedip</b> yükleyin (tarayıcıda Yazdır → PDF olarak kaydet) ya da iş emrindeki yazıyı
              kopyalayıp aşağıya yapıştırın. Dosya yalnız bu tarayıcıda okunur, hiçbir yere gönderilmez.
            </p>
            <div className="btn-satir" style={{ marginBottom: 10 }}>
              <button className="btn birincil" onClick={() => girdi.current?.click()} disabled={mesgul}>{mesgul ? "Okunuyor…" : "PDF seç…"}</button>
              <input ref={girdi} type="file" accept=".pdf,.txt,application/pdf,text/plain" style={{ display: "none" }}
                onChange={(e) => { dosyaOku(e.target.files[0]); e.target.value = ""; }} />
            </div>
            {dosya && <div className="ipucu">Yüklenen: {dosya}</div>}
            <label className="alan-etiket" htmlFor="ie-metin">…ya da iş emri yazısını yapıştırın</label>
            <textarea id="ie-metin" className="alan" style={{ height: 180, padding: 9, fontFamily: "var(--mono)", fontSize: 12.5, resize: "vertical" }}
              value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={"İŞ EMRİ  İE-818\nTAKIM BİLGİSİ  Std. Freze 114x15,5x45x16x100\nTakım Çapı 15,5 mm …"} />
            {hata && <div className="uyari" role="alert" style={{ marginTop: 10 }}><div>⚠ {hata}</div></div>}
          </div>
        )}

        {adim === "onay" && onizleme && (
          <div className="modal-govde">
            <div className="ie-ozet">
              <div><small>Takım tipi</small><b>{onizleme.sonuc.tip ? TOOL_TYPES[onizleme.sonuc.tip] : "Okunamadı"}</b></div>
              <div><small>Takım kodu</small><b>{onizleme.sonuc.tipKodu || "-"}</b></div>
              <div><small>İş emri</small><b>{onizleme.sonuc.bilgi.ieNo || "-"}</b></div>
            </div>

            <div className="grup-baslik" style={{ marginTop: 14 }}><span>Okunan değerler</span><small>{onizleme.sonuc.bulunan.length} alan</small></div>
            <div className="ie-tablo">
              {onizleme.sonuc.bulunan.length === 0 && <div className="ipucu" style={{ padding: 10 }}>Hiçbir alan okunamadı. Yazıyı kontrol edin.</div>}
              {onizleme.sonuc.bulunan.map((b, i) => (
                <div key={i} className="ie-satir"><span>{b.etiket}</span><b>{b.ham}</b><em>{b.kullanim}</em></div>
              ))}
            </div>

            {onizleme.hatalar.length > 0 && (
              <div className="uyari" role="alert" style={{ marginTop: 12 }}>
                <div><b>Geometri uyarısı</b> (resim yine de çizilir; Takım sekmesinden düzeltin)</div>
                {onizleme.hatalar.map((h, i) => <div key={i}>⚠ {h.mesaj}</div>)}
              </div>
            )}
            {onizleme.uyarilar.length > 0 && (
              <div className="uyari uyari-sari" style={{ marginTop: 12 }}>
                <div><b>Dikkat</b></div>
                {onizleme.uyarilar.map((u, i) => <div key={i}>• {u}</div>)}
              </div>
            )}
          </div>
        )}

        <div className="modal-alt">
          {adim === "gir" ? (
            <>
              <button className="btn hayalet" onClick={kapat}>İptal</button>
              <button className="btn birincil" disabled={!metin.trim() || mesgul} onClick={() => setAdim("onay")}>Değerleri oku →</button>
            </>
          ) : (
            <>
              <button className="btn hayalet" onClick={() => setAdim("gir")}>← Geri</button>
              <button className="btn birincil" onClick={() => uygula(onizleme.params)}>Resmi çiz</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
