export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && window.location.hostname !== "localhost") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration.scope)

          registration.addEventListener("updatefound", () => {
            // Un nuevo service worker está siendo instalado
            const installingWorker = registration.installing
            if (installingWorker == null) return

            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  console.log("Nueva versión de la aplicación disponible")
                  // Opcional: mostrar notificación al usuario
                } else {
                  // Primera instalación
                  console.log("Aplicación disponible offline")
                }
              }
            })
          })
        })
        .catch((error) => {
          console.error("Error durante el registro del Service Worker:", error)
        })
    })

    // Manejar actualizaciones
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }
}

