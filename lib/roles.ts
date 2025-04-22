import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Corregir el tipo del caché para asegurar que siempre almacene objetos con la estructura correcta
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutos

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false

  // Verificar si el resultado está en caché
  if (adminCache.has(email)) {
    const cacheEntry = adminCache.get(email)
    if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_EXPIRY) {
      return cacheEntry.isAdmin
    }
  }

  try {
    // Verificar directamente si existe un documento con el ID igual al email
    const adminDocRef = doc(db, "admins", email)
    const adminDoc = await getDoc(adminDocRef)

    const isAdmin = adminDoc.exists()

    // Guardar en caché
    adminCache.set(email, { isAdmin, timestamp: Date.now() })

    return isAdmin
  } catch (error) {
    console.error("Error verificando rol de administrador:", error)
    return false
  }
}

// Función auxiliar para verificar si un usuario es admin de forma síncrona
export function isAdminEmailSync(email: string | null | undefined): boolean {
  if (!email) return false

  // Solo verificar la caché
  if (adminCache.has(email)) {
    const cacheEntry = adminCache.get(email)
    if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_EXPIRY) {
      return cacheEntry.isAdmin
    }
  }

  // Si no está en caché o ha expirado, asumir que no es admin
  return false
}
