import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import webPush from "web-push"

// Configurar VAPID
webPush.setVapidDetails(
  "mailto:support@prescriptionseeding.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

// Lista de correos electrónicos de administradores autorizados
const adminEmails = ["support@prescriptionseeding.com"]

// Función para verificar si un correo electrónico es de administrador
function isAdminEmail(email: string): boolean {
  return adminEmails.includes(email)
}

// Interfaz para la suscripción almacenada en Firestore
interface StoredSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  expirationTime?: number | null
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json()

    // Verificar autenticación y permisos de admin
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    // Solo permitir a administradores enviar notificaciones
    if (!decodedToken.email || !isAdminEmail(decodedToken.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener suscripciones del usuario
    const subscriptionsRef = collection(db, "push_subscriptions")
    const q = query(subscriptionsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    // Enviar notificación a todas las suscripciones
    const notifications = querySnapshot.docs.map(async (doc) => {
      const data = doc.data() as StoredSubscription

      // Crear un objeto de suscripción válido para web-push
      const subscription = {
        endpoint: data.endpoint,
        keys: data.keys,
        expirationTime: data.expirationTime || null,
      }

      try {
        await webPush.sendNotification(
          subscription,
          JSON.stringify({
            title,
            body,
            url: url || "/dashboard",
          }),
        )
      } catch (error: any) {
        // Si la suscripción ya no es válida, eliminarla
        if (error.statusCode === 410) {
          await deleteDoc(doc.ref)
        }
        console.error(`Error sending notification to subscription ${doc.id}:`, error)
      }
    })

    await Promise.all(notifications)

    return NextResponse.json({ message: "Notificaciones enviadas" })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Error al enviar notificación" }, { status: 500 })
  }
}

