import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { yaziHazirla } from "./assets/yazi";

// Çizim yazı tipi yüklenmeden çizmeyelim: ölçü yazılarının genişliği ölçülüyor
yaziHazirla().then(() => createRoot(document.getElementById("root")).render(<App />));

// Kurulabilir uygulama: servis işçisi yalnız yayın sürümünde ve http(s) üzerinde (dosyadan açılışta ve geliştirmede yok)
if (import.meta.env.PROD && "serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => { /* kayıt başarısız: uygulama yine çalışır */ }); });
}
