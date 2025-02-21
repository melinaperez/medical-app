/* eslint-disable no-restricted-globals */
const CACHE_NAME = "prescription-seeding-cache-v1"

// Archivos a cachear
const CACHE_URLS = [
  "/",
  "/login",
  "/dashboard",
  "/medical-form",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
]

// @ts-ignore
self.addEventListener("install", (event) => {
  /** @type {ExtendableEvent} */ const e = event
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS)
    }),
  )
})

// @ts-ignore
self.addEventListener("fetch", (event) => {
  /** @type {FetchEvent} */ const e = event
  if (e.request.method !== "GET") return

  e.respondWith(
    caches.match(e.request).then((response) => {
      // Retorna la respuesta cacheada si existe
      if (response) {
        return response
      }

      // Si no está en caché, hace la petición a la red
      return fetch(e.request).then((response) => {
        // No cachear si la respuesta no es válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clonar la respuesta ya que se va a usar dos veces
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache)
        })

        return response
      })
    }),
  )
})

// @ts-ignore
self.addEventListener("activate", (event) => {
  /** @type {ExtendableEvent} */ const e = event
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

