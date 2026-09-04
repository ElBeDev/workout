/* Workout service worker: app shell + last-visited pages available offline.
 * - Navigations: network first, fall back to the cached copy of that URL,
 *   then to /offline.
 * - /_next/static (hashed, immutable) and exercise gifs: cache first.
 * - Everything else (server actions, API, RSC fetches): network only.
 */
const VERSION = "v2";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  const isStatic = url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
  const isGif =
    url.hostname === "static.exercisedb.dev" || url.hostname.endsWith(".public.blob.vercel-storage.com");
  const isIcon = url.origin === self.location.origin && /\.(png|ico|webmanifest)$/.test(url.pathname);
  if (isStatic || isGif || isIcon) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok || response.type === "opaque") {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
