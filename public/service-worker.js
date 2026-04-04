const CACHE_NAME = "loudables-v2";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];
const CACHEABLE_DESTINATIONS = new Set([
  "document",
  "script",
  "style",
  "image",
  "font",
  "manifest"
]);

function isSafeRequest(request) {
  if (!request || request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  if (url.protocol === "chrome-extension:") {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  const path = url.pathname;
  if (
    path.includes("/@vite") ||
    path.includes("/__vite") ||
    path.includes("/node_modules/.vite") ||
    path.includes("/hot-update") ||
    path.includes("sockjs")
  ) {
    return false;
  }

  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return false;
  }

  if (request.destination && !CACHEABLE_DESTINATIONS.has(request.destination)) {
    return false;
  }

  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (!isSafeRequest(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Promise.reject(new Error("Network failed and no cache fallback."));
        });
    })
  );
});
