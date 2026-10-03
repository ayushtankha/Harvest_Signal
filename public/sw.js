// HarvestSignal service worker: keeps the app usable in airplane mode.
// Same-origin only. Model files are cached by the AI worker in their own cache.
const VERSION = "hs-app-v1";
const PRECACHE = ["/", "/visitor", "/noor", "/settings", "/demo", "/ort/ort-wasm-simd-threaded.jsep.mjs"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("hs-app-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "version") e.ports[0]?.postMessage(VERSION);
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Model + engine files: served from the model cache filled by the AI worker.
  if (url.pathname.startsWith("/models/") || url.pathname.startsWith("/__l5e/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) caches.open("harvestsignal-models-v1").then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
    return;
  }

  // Pages: network first, fall back to cache (then to the home page shell).
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Scripts, styles, fonts, images: cache first, update in background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }),
  );
});
