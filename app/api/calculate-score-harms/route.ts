import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const data = await request.json()

  // Extract values
  const { genero, colesterolTotal, presionSistolica, tratamientoHipertension, diabetes, fumador } =
    data

  // Calculate base score
  let score = 0

  //Calculo Major
  let major = 0
  if (colesterolTotal >= 240) major+=1
  if (presionSistolica >= 160) major+=1
  if (tratamientoHipertension == 'S') major += 1
  if (fumador == 'S') major += 1
  if (diabetes == 'S') major +=1


  //Calculo Elevated
  let elevated = 0
  if (colesterolTotal >= 200 && colesterolTotal < 240) elevated+=1
  if (presionSistolica >=140 && presionSistolica < 160 && tratamientoHipertension == 'N') elevated+=1

  //Calculo Not Optimal
  let notOptimal = 0
  if (colesterolTotal >= 180 && colesterolTotal < 200) notOptimal+=1
  if (presionSistolica >=120 && presionSistolica < 140 && tratamientoHipertension == 'N') notOptimal+=1

  //Calculo All Optimal
  let allOptimal = 0
  if (colesterolTotal < 180) allOptimal+=1
  if (presionSistolica <120 && tratamientoHipertension == 'N') allOptimal+=1

  let major2 = 0
  let major1 = 0
  let elevatedFinal = 0
  let notOptimalFinal = 0
  let allOptimalFinal = 0

  //Calculo los multiplicadores
  if (major >= 2) major2 = 1
  else if (major == 1) major1 = 1    
  else {
    if (elevated >= 1) elevatedFinal = 1
    else {
      if (notOptimal >=1) notOptimalFinal = 1
      else {
        if (allOptimal == 2) allOptimalFinal = 1
      }
    }
  }

  //Constantes femeninas
  const major2F = 50
  const major1F = 39
  const elevatedF = 39
  const notOptimalF = 27
  const allOptimalF = 8

  //Constantes masculinas
  const major2M = 69
  const major1M = 50
  const elevatedM = 46
  const notOptimalM = 36
  const allOptimalM = 5

  if (genero == 'F')
    score = (major2 * major2F) + (major1 * major1F) + (elevatedFinal * elevatedF) + (notOptimalFinal * notOptimalF) + (allOptimalFinal * allOptimalF)
  if (genero == 'M')
    score = (major2 * major2M) + (major1 * major1M) + (elevatedFinal * elevatedM) + (notOptimalFinal * notOptimalM) + (allOptimalFinal * allOptimalM)

  return NextResponse.json({ score })
}

