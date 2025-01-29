import { NextResponse } from "next/server"

interface ScoreResult {
  harms2afScore: number
  mtaiwanScore: number
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Extract values
    const {
      edad,
      genero,
      presionSistolica,
      hipertensionArterial,
      tabaquismo,
      imc,
      apneaSueno,
      usoAlcohol,
      insuficienciaCardiaca,
      enfermedadCoronaria,
      enfermedadRenal,
    } = data

    // Calcular HARMS2-AF Score
    let harms2afScore = 0

    // Hipertensión Arterial (4 puntos)
    if (hipertensionArterial === "S") {
      harms2afScore += 4
    }

    // Edad
    const edadNum = Number(edad)
    if (edadNum >= 65) {
      harms2afScore += 2
    } else if (edadNum >= 60) {
      harms2afScore += 1
    }

    // IMC ≥30
    if (imc === "S") {
      harms2afScore += 1
    }

    // Género Masculino
    if (genero === "M") {
      harms2afScore += 1
    }

    // Apnea del Sueño
    if (apneaSueno === "S") {
      harms2afScore += 1
    }

    // Tabaquismo
    if (tabaquismo === "S") {
      harms2afScore += 1
    }

    // Uso de Alcohol
    if (usoAlcohol === "alto") {
      harms2afScore += 2
    } else if (usoAlcohol === "moderado") {
      harms2afScore += 1
    }


    // Calcular mTaiwan AF Score
    let mtaiwanScore = 0

    // Edad
    if (edadNum >= 80) mtaiwanScore += 8
    else if (edadNum >= 75) mtaiwanScore += 5
    else if (edadNum >= 70) mtaiwanScore += 4
    else if (edadNum >= 65) mtaiwanScore += 3
    else if (edadNum >= 60) mtaiwanScore += 2
    else if (edadNum >= 55) mtaiwanScore += 1
    else if (edadNum >= 50) mtaiwanScore += 0
    else if (edadNum >= 45) mtaiwanScore -= 1
    else if (edadNum >= 40) mtaiwanScore -= 2


    // Género Masculino
    if (genero === "M") {
      mtaiwanScore += 1
    }

    // Hipertensión
    if (hipertensionArterial === "S") {
      mtaiwanScore += 1
    }

    // Insuficiencia Cardíaca
    if (insuficienciaCardiaca === "S") {
      mtaiwanScore += 2
    }

    // Enfermedad Coronaria
    if (enfermedadCoronaria === "S") {
      mtaiwanScore += 1
    }

    // Enfermedad Renal
    if (enfermedadRenal === "S") {
      mtaiwanScore += 1
    }


    return NextResponse.json({ harms2afScore, mtaiwanScore })
  } catch (error) {
    return NextResponse.json({ error: "Error al calcular los scores" }, { status: 500 })
  }
}

