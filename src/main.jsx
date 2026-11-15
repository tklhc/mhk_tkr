import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { yaziHazirla } from "./assets/yazi";

// Çizim yazı tipi yüklenmeden çizmeyelim: ölçü yazılarının genişliği ölçülüyor
yaziHazirla().then(() => createRoot(document.getElementById("root")).render(<App />));
