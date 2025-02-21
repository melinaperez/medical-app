/* eslint-disable no-restricted-globals */
const CACHE_NAME = "prescription-seeding-cache-v1"
const DB_NAME = "prescription-seeding-db"
const DB_VERSION = 1
const OFFLINE_MUTATION_STORE = "offline-mutations"

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

// Inicializar IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(OFFLINE_MUTATION_STORE)) {
        db.createObjectStore(OFFLINE_MUTATION_STORE, { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

// Guardar mutación offline
async function saveOfflineMutation(mutation) {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_MUTATION_STORE, "readwrite")
    const store = transaction.objectStore(OFFLINE_MUTATION_STORE)
    const request = store.add(mutation)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Obtener mutaciones offline
async function getOfflineMutations() {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_MUTATION_STORE, "readonly")
    const store = transaction.objectStore(OFFLINE_MUTATION_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Limpiar mutaciones sincronizadas
async function clearSyncedMutations(ids) {
  const db = await initDB()
  const transaction = db.transaction(OFFLINE_MUTATION_STORE, "readwrite")
  const store = transaction.objectStore(OFFLINE_MUTATION_STORE)

  for (const id of ids) {
    store.delete(id)
  }
}

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS)
    }),
  )
})

// Activación del Service Worker
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

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== "GET") {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Retornar página offline si está en caché
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html")
          }
          return new Response("", { status: 408, statusText: "Sin conexión" })
        })
    }),
  )
})

// Manejar sincronización en segundo plano
self.addEventListener("sync", async (event) => {
  if (event.tag === "sync-pending-mutations") {
    event.waitUntil(syncPendingMutations())
  }
})

// Sincronizar mutaciones pendientes
async function syncPendingMutations() {
  const mutations = await getOfflineMutations()
  const syncedIds = []

  for (const mutation of mutations) {
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mutation),
      })

      if (response.ok) {
        syncedIds.push(mutation.id)
      }
    } catch (error) {
      console.error("Error syncing mutation:", error)
    }
  }

  await clearSyncedMutations(syncedIds)
}

// Manejar sincronización periódica
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-data") {
    event.waitUntil(updateData())
  }
})

// Actualizar datos periódicamente
async function updateData() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch("/api/update-data")
    if (response.ok) {
      await cache.put("/api/data", response)
    }
  } catch (error) {
    console.error("Error updating data:", error)
  }
}

// Manejar notificaciones push
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Manejar clic en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        const url = event.notification.data.url

        // Buscar ventana existente
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus()
          }
        }

        // Si no hay ventana existente, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
  )
})

