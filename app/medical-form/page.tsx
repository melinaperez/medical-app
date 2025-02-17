"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PatientData {
  nombre: string
  apellido: string
  pais: string
  genero: string
  edad: string
  colesterolTotal: string
  presionSistolica: string
  hipertensionArterial: string
  imc: string
  tabaquismo: string
  apneaSueno: string
  usoAlcohol: string
  insuficienciaCardiaca: string
  enfermedadCoronaria: string
  enfermedadRenal: string
  enfermedadCerebrovascular: string
  enfermedadVascular: string
  diabetesMellitus: string
  ecgSobrecarga: string
  ecoHipertrofia: string
  ecoDilatacion: string
  extrasistolia: string
  ejercicioAerobico: string
  ejerciciosFuerza: string
  estaFatigado: string
  subeEscaleras: string
  caminaManzana: string
  masCincoEnfermedades: string
  perdidaPeso: string
  harms2afScore?: number
  mtaiwanScore?: number
}

interface ScoreResult {
  harms2afScore: number
  mtaiwanScore: number
  frailScore: number
  frailInterpretation: string
  heartsScore: number
  heartsRiskLevel: string
  heartsRiskColor: string
}

const initialFormData: PatientData = {
  nombre: "",
  apellido: "",
  pais: "",
  genero: "",
  edad: "",
  colesterolTotal: "",
  presionSistolica: "",
  hipertensionArterial: "",
  imc: "",
  tabaquismo: "",
  apneaSueno: "",
  usoAlcohol: "",
  insuficienciaCardiaca: "",
  enfermedadCoronaria: "",
  enfermedadRenal: "",
  enfermedadCerebrovascular: "",
  enfermedadVascular: "",
  diabetesMellitus: "",
  ecgSobrecarga: "",
  ecoHipertrofia: "",
  ecoDilatacion: "",
  extrasistolia: "",
  ejercicioAerobico: "",
  ejerciciosFuerza: "",
  estaFatigado: "",
  subeEscaleras: "",
  caminaManzana: "",
  masCincoEnfermedades: "",
  perdidaPeso: "",
}

const fieldLabels: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  genero: "Género",
  edad: "Edad",
  colesterolTotal: "Colesterol total",
  presionSistolica: "Presión Sistólica",
  hipertensionArterial: "Hipertensión Arterial",
  tabaquismo: "Tabaquismo",
  imc: "IMC ≥ 30kg/m²",
  apneaSueno: "Apnea del sueño",
  usoAlcohol: "Uso de alcohol",
  insuficienciaCardiaca: "Insuficiencia cardíaca",
  enfermedadCoronaria: "Enfermedad coronaria",
  enfermedadRenal: "Enfermedad renal crónica",
  enfermedadCerebrovascular: "Enfermedad cerebrovascular",
  enfermedadVascular: "Enf. vascular periférica",
  diabetesMellitus: "Diabetes mellitus",
  ecgSobrecarga: "ECG sobrecarga ventricular izquierda",
  ecoHipertrofia: "ECO 2D hipertrofia ventricular izquierda",
  ecoDilatacion: "ECO 2D dilatación auricular izquierda",
  extrasistolia: "Extrasistolia supraventricular frecuente",
  ejercicioAerobico: "Ejercicio aeróbico",
  ejerciciosFuerza: "Ejercicios de fuerza",
  estaFatigado: "¿Está usted fatigado?",
  subeEscaleras: "¿Puede subir un piso de escaleras?",
  caminaManzana: "¿Puede caminar una manzana?",
  masCincoEnfermedades: "¿Tiene más de cinco enfermedades?",
  perdidaPeso: "¿Ha perdido más del 5% de su peso en los últimos 6 meses?",
}

const alcoholOptions = [
  { value: "ninguna", label: "Ninguna medida" },
  { value: "moderado", label: "7-14 medidas estándar/semana" },
  { value: "alto", label: ">=15 medidas estándar/semana" },
]

const ejercicioAerobicoOptions = [
  { value: "no", label: "No" },
  { value: "hasta150", label: "Hasta 150 min semanales" },
  { value: "mas150", label: "Más 150 min semanales" },
]

const ejerciciosFuerzaOptions = [
  { value: "no", label: "No" },
  { value: "hasta60", label: "Hasta 60 min semanales" },
  { value: "mas60", label: "Más de 60 min semanales" },
]

const countries = [
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "EC", name: "Ecuador" },
  { code: "MX", name: "México" },
  { code: "PE", name: "Perú" },
].sort((a, b) => a.name.localeCompare(b.name))

const initialScore = null
const initialLoading = false
const initialError = null
const initialScores: ScoreResult | null = null
const initialIsSubmitted = false

export default function MedicalFormPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [score, setScore] = useState<number | null>(initialScore)
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(initialError)
  const [formData, setFormData] = useState<PatientData>(initialFormData)
  const [scores, setScores] = useState<ScoreResult | null>(initialScores)
  const [isSubmitted, setIsSubmitted] = useState(initialIsSubmitted)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
    setIsLoading(false)
  }, [user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg">Cargando...</p>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitted) return
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleToggleChange = (name: string, value: string | undefined) => {
    if (isSubmitted) return
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (isSubmitted) return
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNewPatient = () => {
    setFormData(initialFormData)
    setScores(null)
    setIsSubmitted(false)
    setError(null)
  }

  const calculateScore = async (data: PatientData) => {
    try {
      const response = await fetch("/api/calculate-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          edad: Number.parseInt(data.edad),
          presionSistolica: Number.parseInt(data.presionSistolica),
          colesterolTotal: Number.parseInt(data.colesterolTotal), //Added colesterolTotal
        }),
      })

      if (!response.ok) {
        throw new Error("Error al calcular el score")
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error calculating score:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      // Validate fields
      const emptyFields = Object.entries(formData)
        .filter(([_, value]) => !value)
        .map(([key]) => fieldLabels[key] || key)

      if (emptyFields.length > 0) {
        throw new Error(`Los siguientes campos son requeridos: ${emptyFields.join(", ")}`)
      }

      // Calculate scores
      const calculatedScores = await calculateScore(formData)
      setScores(calculatedScores)

      // Prepare data for Firestore
      const patientData = {
        ...formData,
        edad: Number.parseInt(formData.edad),
        presionSistolica: Number.parseInt(formData.presionSistolica),
        colesterolTotal: Number.parseInt(formData.colesterolTotal), //Added colesterolTotal
        harms2afScore: calculatedScores.harms2afScore,
        mtaiwanScore: calculatedScores.mtaiwanScore,
        frailScore: calculatedScores.frailScore,
        frailInterpretation: calculatedScores.frailInterpretation,
        heartsScore: calculatedScores.heartsScore,
        heartsRiskLevel: calculatedScores.heartsRiskLevel,
        heartsRiskColor: calculatedScores.heartsRiskColor,
        doctorId: user.uid,
        doctorEmail: user.email,
        createdAt: serverTimestamp(),
      }

      // Save to Firebase
      const patientsRef = collection(db, "patients")
      const docRef = await addDoc(patientsRef, patientData)

      toast({
        title: "Datos guardados",
        description: "Los datos del paciente se han guardado correctamente.",
      })

      setIsSubmitted(true)
    } catch (error: any) {
      console.error("Detailed error:", {
        message: error?.message || "Unknown error",
        code: error?.code,
        stack: error?.stack,
      })

      setError(error.message || "Error al guardar los datos. Por favor, intente nuevamente.")

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al guardar los datos",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Formulario Médico</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Conectado como: {user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isSubmitted && <Button onClick={handleNewPatient}>Nuevo Paciente</Button>}
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSubmitted && (
            <Alert className="mb-6">
              <AlertDescription>
                Paciente guardado exitosamente. Puede crear un nuevo paciente o volver al dashboard.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Select
                value={formData.pais}
                onValueChange={(value) => handleSelectChange("pais", value)}
                disabled={isSubmitted}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccione un país">
                    {formData.pais && (
                      <span className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/20x15/${formData.pais.toLowerCase()}.png`}
                          alt={`${countries.find((c) => c.code === formData.pais)?.name} flag`}
                          className="h-3.5 w-5 object-contain"
                        />
                        <span>{countries.find((c) => c.code === formData.pais)?.name}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/20x15/${country.code.toLowerCase()}.png`}
                          alt={`${country.name} flag`}
                          className="h-3.5 w-5 object-contain"
                        />
                        <span>{country.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="block mb-2">Género</Label>
                <ToggleGroup
                  type="single"
                  value={formData.genero}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("genero", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="M" className="flex-1" aria-label="Masculino">
                    M
                  </ToggleGroupItem>
                  <ToggleGroupItem value="F" className="flex-1" aria-label="Femenino">
                    F
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  name="edad"
                  type="number"
                  min="40"
                  max="100"
                  value={formData.edad}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colesterolTotal">Colesterol total (mg/dL)</Label>
                <Input
                  id="colesterolTotal"
                  name="colesterolTotal"
                  type="number"
                  min="0"
                  value={formData.colesterolTotal}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="presionSistolica">Presión Sistólica (mm Hg)</Label>
                <Input
                  id="presionSistolica"
                  name="presionSistolica"
                  type="number"
                  min="0"
                  value={formData.presionSistolica}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted}
                />
              </div>
              <div className="space-y-2">
                <Label className="block mb-2">Hipertensión Arterial</Label>
                <ToggleGroup
                  type="single"
                  value={formData.hipertensionArterial}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("hipertensionArterial", value)
                  }
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">IMC ≥ 30kg/m²</Label>
                <ToggleGroup
                  type="single"
                  value={formData.imc}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("imc", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label className="block mb-2">Tabaquismo</Label>
                <ToggleGroup
                  type="single"
                  value={formData.tabaquismo}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("tabaquismo", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">Apnea del sueño</Label>
                <ToggleGroup
                  type="single"
                  value={formData.apneaSueno}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("apneaSueno", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-4">
                <Label className="block mb-2">Uso de alcohol</Label>
                <Select
                  value={formData.usoAlcohol}
                  onValueChange={(value) => handleSelectChange("usoAlcohol", value)}
                  disabled={isSubmitted}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {alcoholOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="block mb-2">Insuficiencia cardíaca</Label>
                <ToggleGroup
                  type="single"
                  value={formData.insuficienciaCardiaca}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("insuficienciaCardiaca", value)
                  }
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-3">
                <Label className="block mb-2">Enfermedad coronaria</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadCoronaria}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("enfermedadCoronaria", value)
                  }
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-3">
                <Label className="block mb-2">Enfermedad renal crónica</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadRenal}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("enfermedadRenal", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">Enfermedad cerebrovascular</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadCerebrovascular}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("enfermedadCerebrovascular", value)
                  }
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">Enf. vascular periférica</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadVascular}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("enfermedadVascular", value)
                  }
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">Diabetes mellitus</Label>
                <ToggleGroup
                  type="single"
                  value={formData.diabetesMellitus}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("diabetesMellitus", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* New fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">ECG sobrecarga ventricular izquierda</Label>
                <ToggleGroup
                  type="single"
                  value={formData.ecgSobrecarga}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("ecgSobrecarga", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">ECO 2D hipertrofia ventricular izquierda</Label>
                <ToggleGroup
                  type="single"
                  value={formData.ecoHipertrofia}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("ecoHipertrofia", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">ECO 2D dilatación auricular izquierda</Label>
                <ToggleGroup
                  type="single"
                  value={formData.ecoDilatacion}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("ecoDilatacion", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">Extrasistolia supraventricular frecuente</Label>
                <ToggleGroup
                  type="single"
                  value={formData.extrasistolia}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("extrasistolia", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Evaluación de Estado Físico</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="block mb-2">Ejercicio aeróbico</Label>
                  <Select
                    value={formData.ejercicioAerobico}
                    onValueChange={(value) => handleSelectChange("ejercicioAerobico", value)}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccione una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {ejercicioAerobicoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="block mb-2">Ejercicios de fuerza</Label>
                  <Select
                    value={formData.ejerciciosFuerza}
                    onValueChange={(value) => handleSelectChange("ejerciciosFuerza", value)}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccione una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {ejerciciosFuerzaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block mb-2">¿Está usted fatigado?</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.estaFatigado}
                    onValueChange={(value: string | undefined) => value && handleToggleChange("estaFatigado", value)}
                    className="w-full"
                    disabled={isSubmitted}
                  >
                    <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                      Sí
                    </ToggleGroupItem>
                    <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <Label className="block mb-2">¿Puede subir un piso de escaleras?</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.subeEscaleras}
                    onValueChange={(value: string | undefined) => value && handleToggleChange("subeEscaleras", value)}
                    className="w-full"
                    disabled={isSubmitted}
                  >
                    <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                      Sí
                    </ToggleGroupItem>
                    <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block mb-2">¿Puede caminar una manzana?</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.caminaManzana}
                    onValueChange={(value: string | undefined) => value && handleToggleChange("caminaManzana", value)}
                    className="w-full"
                    disabled={isSubmitted}
                  >
                    <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                      Sí
                    </ToggleGroupItem>
                    <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <Label className="block mb-2">
                    ¿Tiene más de cinco enfermedades?{" "}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="inline h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] text-sm">
                          Hipertensión, diabetes, cáncer (que no sea un cáncer de piel leve), enfermedad pulmonar
                          crónica, infarto de miocardio, insuficiencia cardiaca congestiva, angina de pecho, asma,
                          artritis, accidente cerebrovascular y/o enfermedad renal
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={formData.masCincoEnfermedades}
                    onValueChange={(value: string | undefined) =>
                      value && handleToggleChange("masCincoEnfermedades", value)
                    }
                    className="w-full"
                    disabled={isSubmitted}
                  >
                    <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                      Sí
                    </ToggleGroupItem>
                    <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                      No
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">¿Ha perdido más del 5% de su peso en los últimos 6 meses?</Label>
                <ToggleGroup
                  type="single"
                  value={formData.perdidaPeso}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("perdidaPeso", value)}
                  className="w-full"
                  disabled={isSubmitted}
                >
                  <ToggleGroupItem value="S" className="flex-1" aria-label="Sí">
                    Sí
                  </ToggleGroupItem>
                  <ToggleGroupItem value="N" className="flex-1" aria-label="No">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {!isSubmitted && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            )}
          </form>

          {scores !== null && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Riesgo calculado HARMS<sub>2</sub>-AF:
                </h3>
                <p className="text-2xl font-bold">{scores.harms2afScore}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold mb-2">Riesgo calculado mTaiwan-AF:</h3>
                <p className="text-2xl font-bold">{scores.mtaiwanScore}</p>
              </div>
               <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold mb-2">Escala FRAIL:</h3>
                <p className="text-2xl font-bold">
                  {scores.frailScore} - {scores.frailInterpretation}
                </p>
              </div>
              <div className={`p-4 rounded-lg text-white ${scores.heartsRiskColor}`}>
                <h3 className="font-semibold mb-2">Riesgo calculado HEARTS:</h3>
                <p className="text-2xl font-bold">{scores.heartsScore}%</p>
                <p className="text-lg">{scores.heartsRiskLevel}</p>
              </div>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                Volver al Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

