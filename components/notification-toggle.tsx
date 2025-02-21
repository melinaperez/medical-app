"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/contexts/notification-context"
import { Bell, BellOff } from "lucide-react"

export function NotificationToggle() {
  const { pushSupported, subscription, subscribeToPush, unsubscribeFromPush } = useNotifications()

  if (!pushSupported) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (subscription ? unsubscribeFromPush() : subscribeToPush())}
      title={subscription ? "Desactivar notificaciones" : "Activar notificaciones"}
    >
      {subscription ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
    </Button>
  )
}

