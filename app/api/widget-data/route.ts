import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    // Obtener la fecha de inicio del día actual
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDay = Timestamp.fromDate(today)

    // Consultar pacientes registrados hoy
    const patientsRef = collection(db, "patients")
    const q = query(patientsRef, where("createdAt", ">=", startOfDay))

    const querySnapshot = await getDocs(q)
    const patientsCount = querySnapshot.size

    // Calcular promedios de riesgo
    let totalHarms2af = 0
    let totalMtaiwan = 0
    let totalHearts = 0

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      totalHarms2af += data.harms2afScore || 0
      totalMtaiwan += data.mtaiwanScore || 0
      totalHearts += data.heartsScore || 0
    })

    const avgHarms2af = patientsCount ? Math.round(totalHarms2af / patientsCount) : 0
    const avgMtaiwan = patientsCount ? Math.round(totalMtaiwan / patientsCount) : 0
    const avgHearts = patientsCount ? Math.round(totalHearts / patientsCount) : 0

    return NextResponse.json({
      patientsToday: patientsCount,
      averageScores: {
        harms2af: avgHarms2af,
        mtaiwan: avgMtaiwan,
        hearts: avgHearts,
      },
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching widget data:", error)
    return NextResponse.json({ error: "Error al obtener datos del widget" }, { status: 500 })
  }
}

