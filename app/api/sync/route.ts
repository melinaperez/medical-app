import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const mutation = await request.json()

    // Procesar la mutación según su tipo
    switch (mutation.type) {
      case "ADD_PATIENT":
        await addDoc(collection(db, "patients"), {
          ...mutation.data,
          createdAt: serverTimestamp(),
        })
        break

      case "UPDATE_PATIENT":
        // Implementar actualización de paciente
        break

      default:
        throw new Error("Tipo de mutación no soportado")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error syncing mutation:", error)
    return NextResponse.json({ error: "Error al sincronizar los datos" }, { status: 500 })
  }
}

