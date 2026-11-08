/* Service worker di Tempi Verbali: tutta l'app in cache, funziona offline.
   Per pubblicare una nuova versione basta cambiare VERSION. */
const VERSION = "tv-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
  "./fonts/Inter-Regular.woff2",
  "./fonts/Inter-Medium.woff2",
  "./fonts/Inter-SemiBold.woff2",
  "./fonts/Poppins-Medium.woff2",
  "./fonts/Poppins-Bold.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Pagina: prima la rete (per ricevere gli aggiornamenti), poi la cache se sei offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html", { ignoreSearch: true }))
    );
    return;
  }

  // Tutto il resto: prima la cache
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
