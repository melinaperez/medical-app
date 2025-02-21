/// <reference lib="webworker" />
/// <reference lib="es2015" />

// Asegurarnos de que TypeScript trate esto como un módulo
export {}

declare const self: ServiceWorkerGlobalScope

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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna la respuesta cacheada si existe
      if (response) {
        return response
      }

      // Si no está en caché, hace la petición a la red
      return fetch(event.request).then((response) => {
        // No cachear si la respuesta no es válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clonar la respuesta ya que se va a usar dos veces
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})

// Limpiar cachés antiguos
self.addEventListener("activate", (event) => {
  event.waitUntil(
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

