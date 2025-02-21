import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, getDocs } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const patientsRef = collection(db, "patients")
    const querySnapshot = await getDocs(query(patientsRef))

    let totalHarms2af = 0
    let totalMtaiwan = 0
    let totalHearts = 0
    let highRiskCount = 0
    const totalPatients = querySnapshot.size

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      totalHarms2af += data.harms2afScore || 0
      totalMtaiwan += data.mtaiwanScore || 0
      totalHearts += data.heartsScore || 0

      // Contar pacientes de alto riesgo (HEARTS > 20%)
      if (data.heartsScore > 20) {
        highRiskCount++
      }
    })

    const avgHarms2af = totalPatients ? Math.round(totalHarms2af / totalPatients) : 0
    const avgMtaiwan = totalPatients ? Math.round(totalMtaiwan / totalPatients) : 0
    const avgHearts = totalPatients ? Math.round(totalHearts / totalPatients) : 0
    const highRiskPercentage = totalPatients ? Math.round((highRiskCount / totalPatients) * 100) : 0

    return NextResponse.json({
      averageScores: {
        harms2af: avgHarms2af,
        mtaiwan: avgMtaiwan,
        hearts: avgHearts,
      },
      highRiskPercentage,
      totalPatients,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching risk widget data:", error)
    return NextResponse.json({ error: "Error al obtener datos de riesgo" }, { status: 500 })
  }
}

