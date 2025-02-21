import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { saveSubscription, removeSubscription } from "@/lib/push-notifications"

export async function POST(request: Request) {
  try {
    const { subscription, action } = await request.json()

    // Verificar autenticación
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    if (!decodedToken.uid) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    if (action === "subscribe") {
      await saveSubscription(decodedToken.uid, subscription)
      return NextResponse.json({ message: "Suscripción guardada" })
    } else if (action === "unsubscribe") {
      await removeSubscription(decodedToken.uid, subscription)
      return NextResponse.json({ message: "Suscripción eliminada" })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error managing push subscription:", error)
    return NextResponse.json({ error: "Error al gestionar la suscripción" }, { status: 500 })
  }
}
