// HarvestSignal service worker: keeps the whole app usable in airplane mode.
// On install it crawls the published build (home page → every referenced
// script/style/font, recursively) so every page's code is saved before the
// first offline navigation. Same-origin only; never redirects online.
// Model files are cached separately by the AI worker ("harvestsignal-models-v1").
const PREFIX = "hs-app-";
const ROUTES = ["/", "/visitor", "/noor", "/settings", "/demo"];
const ASSET_RE = /\/?assets\/[A-Za-z0-9._\-$~@]+\.(?:js|mjs|css|woff2?|svg|png|ico|webp|jpg)/g;
const TEXT_RE = /\.(?:js|mjs|css)$/;

// Retry each download a few times so a weak phone connection doesn't abort the save.
async function getRetry(u) {
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(u, { cache: "no-store" });
      if (res.ok) return res;
      last = new Error("status " + res.status + " " + u);
    } catch (err) { last = err; }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw last || new Error("precache failed: " + u);
}

async function crawl() {
  const found = new Set();
  const queue = [];
  const htmls = {};
  for (const r of ROUTES) {
    const res = await getRetry(r);
    htmls[r] = res.clone();
    const text = await res.text();
    for (const m of text.match(ASSET_RE) || []) queue.push("/" + m.replace(/^\//, ""));
  }
  const bodies = {};
  while (queue.length) {
    const u = queue.shift();
    if (found.has(u)) continue;
    found.add(u);
    const res = await getRetry(u);
    bodies[u] = res.clone();
    if (TEXT_RE.test(u)) {
      const text = await res.text();
      for (const m of text.match(ASSET_RE) || []) queue.push("/" + m.replace(/^\//, ""));
    }
  }
  // Version = hash of the sorted asset list, so each publish gets a fresh cache.
  const list = [...found].sort().join("|");
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(list));
  const version = PREFIX + [...new Uint8Array(digest)].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cache = await caches.open(version);
  await Promise.all([
    ...Object.entries(htmls).map(([k, v]) => cache.put(k, v)),
    ...Object.entries(bodies).map(([k, v]) => cache.put(k, v)),
  ]);
  // Remember which cache is current.
  const meta = await caches.open(PREFIX + "meta");
  await meta.put("/__hs_version", new Response(version));
  return version;
}

async function currentCache() {
  const meta = await caches.open(PREFIX + "meta");
  const r = await meta.match("/__hs_version");
  return r ? caches.open(await r.text()) : null;
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(crawl());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const meta = await caches.open(PREFIX + "meta");
    const r = await meta.match("/__hs_version");
    const keep = r ? await r.text() : "";
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== keep && k !== PREFIX + "meta").map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (e) => {
  if (e.data === "version") {
    (async () => {
      const meta = await caches.open(PREFIX + "meta");
      const r = await meta.match("/__hs_version");
      const v = r ? await r.text() : null;
      const c = v ? await caches.open(v) : null;
      const count = c ? (await c.keys()).length : 0;
      e.ports[0]?.postMessage({ version: v, files: count });
    })();
  }
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Model + engine files: served from the model cache filled by the AI worker.
  if (url.pathname.startsWith("/models/") || url.pathname.startsWith("/__l5e/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open("harvestsignal-models-v1").then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  // Pages: network first (short timeout), then saved exact page, then saved app shell.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await currentCache();
      try {
        const res = await withTimeout(fetch(req), 4000);
        if (res.ok && cache) cache.put(url.pathname, res.clone());
        return res;
      } catch {
        const hit = cache && ((await cache.match(url.pathname)) || (await cache.match("/")));
        return hit || new Response("<h1>Offline</h1><p>This part of the app isn't saved on this phone yet — open it once online.</p>", { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }

  // Hashed build files: cache first (names change on every publish).
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith((async () => {
      const cache = await currentCache();
      const hit = cache && (await cache.match(url.pathname));
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && cache) cache.put(url.pathname, res.clone());
      return res;
    })());
    return;
  }

  // Anything else same-origin (favicon, etc.): cache first, then network.
  e.respondWith((async () => {
    const cache = await currentCache();
    const hit = cache && (await cache.match(req));
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && cache) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response("", { status: 504 });
    }
  })());
});
