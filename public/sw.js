const CACHE_NAME = "agrobase-static-v2";
const ASSETS_TO_CACHE = [
  "/manifest.json",
  "/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Favicon ou asset secundário não encontrado no precache, ignorando:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Páginas e chamadas do React Start podem conter dados de autenticação.
  // Elas precisam sempre chegar ao servidor e nunca podem reutilizar uma
  // resposta de sessão anterior.
  if (event.request.mode === "navigate" || event.request.destination === "") return;

  const cacheableDestinations = new Set(["style", "script", "image", "font", "manifest"]);
  if (!cacheableDestinations.has(event.request.destination)) return;

  // Cache somente para arquivos estáticos.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza o cache em segundo plano (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {
            /* offline fallback */
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.origin === location.origin || url.hostname.includes("fonts"))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => new Response("", { status: 503, statusText: "Offline" }));
    })
  );
});
