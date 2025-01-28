import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const data = await request.json()

  // Extract values
  const { edad, colesterol, presionArterial } = data

  // Parse blood pressure
  const [systolic, diastolic] = presionArterial.split("/").map(Number)

  // Calculate base score
  let score = 100

  // Age factor
  if (edad > 60) score -= 10
  else if (edad > 40) score -= 5

  // Cholesterol factor
  if (colesterol > 240) score -= 20
  else if (colesterol > 200) score -= 10

  // Blood pressure factor
  if (systolic >= 140 || diastolic >= 90) score -= 15
  else if (systolic >= 120 || diastolic >= 80) score -= 5

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  return NextResponse.json({ score })
}

