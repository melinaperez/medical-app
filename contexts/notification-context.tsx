"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface NotificationContextType {
  pushSupported: boolean
  subscription: PushSubscription | null
  permissionState: NotificationPermission
  subscribeToPush: () => Promise<void>
  unsubscribeFromPush: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  pushSupported: false,
  subscription: null,
  permissionState: "default",
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [pushSupported, setPushSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default")

  useEffect(() => {
    // Verificar soporte de notificaciones push
    const checkPushSupport = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

      setPushSupported(supported)

      if (supported) {
        setPermissionState(Notification.permission)

        // Obtener suscripción existente
        const registration = await navigator.serviceWorker.ready
        const existingSubscription = await registration.pushManager.getSubscription()
        setSubscription(existingSubscription)
      }
    }

    checkPushSupport()
  }, [])

  const subscribeToPush = async () => {
    if (!pushSupported || !user) return

    try {
      const registration = await navigator.serviceWorker.ready

      // Solicitar permiso si es necesario
      if (permissionState === "default") {
        const permission = await Notification.requestPermission()
        setPermissionState(permission)
        if (permission !== "granted") return
      }

      // Crear nueva suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Guardar en el servidor
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          action: "subscribe",
          subscription,
        }),
      })

      setSubscription(subscription)
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
    }
  }

  const unsubscribeFromPush = async () => {
    if (!subscription || !user) return

    try {
      // Eliminar suscripción del navegador
      await subscription.unsubscribe()

      // Eliminar del servidor
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          action: "unsubscribe",
          subscription,
        }),
      })

      setSubscription(null)
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        pushSupported,
        subscription,
        permissionState,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

