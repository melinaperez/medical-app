import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore"

export async function GET() {
  try {
    // Obtener datos actualizados
    const lastUpdate = new Date()
    lastUpdate.setHours(lastUpdate.getHours() - 24)

    const patientsRef = collection(db, "patients")
    const q = query(patientsRef, where("updatedAt", ">=", Timestamp.fromDate(lastUpdate)))

    const querySnapshot = await getDocs(q)
    const updatedData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      data: updatedData,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating data:", error)
    return NextResponse.json({ error: "Error al actualizar los datos" }, { status: 500 })
  }
}

