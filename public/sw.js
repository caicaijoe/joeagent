const CACHE_PREFIX = "joeagent-runtime-v2";
const ASSET_CACHE = `${CACHE_PREFIX}-assets`;
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/joeagent-main.png",
  "/Meshy_AI_Golden_Circuit_0314100435_texture.glb",
  "/images/hero_robot_high_res_v2.png",
  "/sounds/activate.mp3",
  "/sounds/ambient.mp3",
  "/sounds/confirm.mp3",
  "/sounds/enter.mp3",
  "/sounds/error.mp3",
  "/sounds/hover-out.mp3",
  "/sounds/hover.mp3",
  "/sounds/scan.mp3",
  "/sounds/typing.mp3"
];
const STATIC_ASSET_RE =
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico|json|glb|mp3|wav|ogg|woff2?)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ASSET_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith("joeagent-runtime") && cacheName !== ASSET_CACHE) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    return;
  }

  if (requestUrl.pathname.startsWith("/_next/")) {
    return;
  }

  const isStaticAsset =
    PRECACHE_URLS.includes(requestUrl.pathname) || STATIC_ASSET_RE.test(requestUrl.pathname);

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();

        caches.open(ASSET_CACHE).then((cache) => cache.put(request, responseClone));
        return networkResponse;
      });
    })
  );
});
