/* Workout service worker: app shell + last-visited pages available offline.
 * - Navigations: network first, fall back to the cached copy of that URL,
 *   then to /offline. Redirected responses (e.g. → /login) are never cached
 *   under the protected URL.
 * - /_next/static (hashed, immutable) and icons: cache first.
 * - Exercise gifs: stale-while-revalidate, so a cached failure heals itself.
 * - Everything else (server actions, API, RSC fetches): network only.
 * - Message { type: "purge-pages" } (sent on logout) drops the page cache.
 * Keep PAGES in sync with src/components/Connectivity.tsx.
 */
const VERSION = "v3";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_GIFS = 400;

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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "purge-pages") {
    event.waitUntil(
      caches.delete(PAGES).then(() => caches.open(PAGES)).then((cache) => cache.add(OFFLINE_URL))
    );
  }
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const finalPath = new URL(response.url || request.url).pathname;
          const cacheable =
            response.ok &&
            !response.redirected &&
            finalPath !== "/login" &&
            finalPath !== "/registro";
          if (cacheable) {
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

  const sameOrigin = url.origin === self.location.origin;
  const isStatic = sameOrigin && url.pathname.startsWith("/_next/static/");
  const isIcon = sameOrigin && /\.(png|ico|webmanifest)$/.test(url.pathname);
  const isGif =
    url.hostname === "static.exercisedb.dev" || url.hostname.endsWith(".public.blob.vercel-storage.com");

  if (isStatic || isIcon) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (isGif) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok || response.type === "opaque") {
              cache.put(request, response.clone());
              trimCache(ASSETS, MAX_GIFS);
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
