"use client"

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

interface PatientData {
  nombre: string
  apellido: string
  genero: string
  edad: string
  presionSistolica: string
  hipertensionArterial: string
  tabaquismo: string
  imc: string
  apneaSueno: string
  usoAlcohol: string
  insuficienciaCardiaca: string
  enfermedadCoronaria: string
  enfermedadRenal: string
  harms2afScore?: number
  mtaiwanScore?: number
}

const initialFormData: PatientData = {
  nombre: "",
  apellido: "",
  genero: "",
  edad: "",
  presionSistolica: "",
  hipertensionArterial: "",
  tabaquismo: "",
  imc: "",
  apneaSueno: "",
  usoAlcohol: "",
  insuficienciaCardiaca: "",
  enfermedadCoronaria: "",
  enfermedadRenal: "",
}

const alcoholOptions = [
  { value: "ninguna", label: "Ninguna medida" },
  { value: "moderado", label: "7-14 medidas estándar/semana" },
  { value: "alto", label: ">=15 medidas estándar/semana" },
]

export default function MedicalFormPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PatientData>(initialFormData)
  const [scores, setScores] = useState<{ harms2afScore: number; mtaiwanScore: number } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleToggleChange = (name: string, value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
        .map(([key]) => key)

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
        harms2afScore: calculatedScores.harms2afScore,
        mtaiwanScore: calculatedScores.mtaiwanScore,
        doctorId: user.uid,
        doctorEmail: user.email,
        createdAt: serverTimestamp(),
      }


      // Save to Firebase
      const patientsRef = collection(db, "patients")
      const docRef = await addDoc(patientsRef, patientData)


      toast({
        title: "Datos guardados",
        description:
          "Los datos del paciente se han guardado correctamente. Será redirigido al dashboard en 5 segundos.",
        duration: 3000, // Add this line to make the toast last 5 seconds
      })

      // Reset form

      setTimeout(() => {
        router.push("/dashboard")
        setFormData(initialFormData)
        setScores(null)
      }, 3000) // 5 seconds delay

      
    } catch (error: any) {
      console.error("Detailed error:", {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack,
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
            <p className="text-sm text-muted-foreground mt-2">Conectado como: {user.email}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Volver al Dashboard
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="block mb-2">Género</Label>
                <ToggleGroup
                  type="single"
                  value={formData.genero}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("genero", value)}
                  className="w-full"
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
                  min="0"
                  max="150"
                  value={formData.edad}
                  onChange={handleInputChange}
                  required
                />
              </div>
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">Hipertensión Arterial</Label>
                <ToggleGroup
                  type="single"
                  value={formData.hipertensionArterial}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("hipertensionArterial", value)
                  }
                  className="w-full"
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
                <Label className="block mb-2">Apnea del Sueño</Label>
                <ToggleGroup
                  type="single"
                  value={formData.apneaSueno}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("apneaSueno", value)}
                  className="w-full"
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
              <Label className="block mb-2">Uso de Alcohol</Label>
              <Select value={formData.usoAlcohol} onValueChange={(value) => handleSelectChange("usoAlcohol", value)}>
                <SelectTrigger>
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

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">Insuficiencia Cardíaca</Label>
                <ToggleGroup
                  type="single"
                  value={formData.insuficienciaCardiaca}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("insuficienciaCardiaca", value)
                  }
                  className="w-full"
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
                <Label className="block mb-2">Enfermedad Coronaria</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadCoronaria}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("enfermedadCoronaria", value)
                  }
                  className="w-full"
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
                <Label className="block mb-2">Enfermedad Renal Crónica</Label>
                <ToggleGroup
                  type="single"
                  value={formData.enfermedadRenal}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("enfermedadRenal", value)}
                  className="w-full"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

