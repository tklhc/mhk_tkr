// Servis işçisi: uygulama kurulabilir ve internetsiz açılır.
// Strateji: ağ önce (güncelleme hemen gelsin), ağ yoksa önbellekten. Yalnız aynı kaynaktan GET istekleri.
// Sürümü değiştirmek eski önbelleği siler (VERSIYON'u derlemede elle artırmaya gerek yok: ağ önce olduğundan
// önbellek her başarılı istekte tazelenir).
const VERSIYON = "mihenk-tr-v1";
const TEMEL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIYON).then((c) => c.addAll(TEMEL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((adlar) => Promise.all(adlar.filter((a) => a !== VERSIYON).map((a) => caches.delete(a)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r)
      .then((yanit) => {
        if (yanit.ok) { const kopya = yanit.clone(); caches.open(VERSIYON).then((c) => c.put(r, kopya)); }
        return yanit;
      })
      .catch(() => caches.match(r).then((o) => o || (r.mode === "navigate" ? caches.match("./") : Response.error()))),
  );
});
