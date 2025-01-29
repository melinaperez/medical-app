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

interface PatientData {
  nombre: string
  apellido: string
  genero: string
  edad: string
  raza: string
  colesterolTotal: string
  colesterolHDL: string
  presionSistolica: string
  tratamientoHipertension: string
  diabetes: string
  fumador: string
}

const initialFormData: PatientData = {
  nombre: "",
  apellido: "",
  genero: "",
  edad: "",
  raza: "",
  colesterolTotal: "",
  colesterolHDL: "",
  presionSistolica: "",
  tratamientoHipertension: "",
  diabetes: "",
  fumador: "",
}

export default function MedicalFormPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PatientData>(initialFormData)

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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked ? "S" : "N",
    }))
  }

  const handleToggleChange = (name: string, value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
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
          colesterolTotal: Number.parseInt(data.colesterolTotal),
          colesterolHDL: Number.parseInt(data.colesterolHDL),
          presionSistolica: Number.parseInt(data.presionSistolica),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al calcular el score")
      }

      const result = await response.json()
      return result.score
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

      // Calculate score
      const calculatedScore = await calculateScore(formData)
      setScore(calculatedScore)

      // Prepare data for Firestore
      const patientData = {
        ...formData,
        edad: Number.parseInt(formData.edad),
        colesterolTotal: Number.parseInt(formData.colesterolTotal),
        colesterolHDL: Number.parseInt(formData.colesterolHDL),
        presionSistolica: Number.parseInt(formData.presionSistolica),
        score: calculatedScore,
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

      // Reset form
      setFormData(initialFormData)
      setScore(null)

      // Redirect to dashboard
      router.push("/dashboard")
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
                <Label className="block mb-2">Raza</Label>
                <ToggleGroup
                  type="single"
                  value={formData.raza}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("raza", value)}
                  className="w-full"
                >
                  <ToggleGroupItem value="AA" className="flex-1" aria-label="AA">
                    AA
                  </ToggleGroupItem>
                  <ToggleGroupItem value="WH" className="flex-1" aria-label="WH">
                    WH
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colesterolTotal">Colesterol Total (mg/dL)</Label>
                <Input
                  id="colesterolTotal"
                  name="colesterolTotal"
                  type="number"
                  min="0"
                  value={formData.colesterolTotal}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colesterolHDL">Colesterol HDL (mg/dL)</Label>
                <Input
                  id="colesterolHDL"
                  name="colesterolHDL"
                  type="number"
                  min="0"
                  value={formData.colesterolHDL}
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

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="block mb-2">Tratamiento por Hipertensión</Label>
                <ToggleGroup
                  type="single"
                  value={formData.tratamientoHipertension}
                  onValueChange={(value: string | undefined) =>
                    value && handleToggleChange("tratamientoHipertension", value)
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
                <Label className="block mb-2">Diabetes</Label>
                <ToggleGroup
                  type="single"
                  value={formData.diabetes}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("diabetes", value)}
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
                <Label className="block mb-2">Fumador</Label>
                <ToggleGroup
                  type="single"
                  value={formData.fumador}
                  onValueChange={(value: string | undefined) => value && handleToggleChange("fumador", value)}
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

          {score !== null && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold mb-2">Score calculado:</h3>
              <p className="text-2xl font-bold">{score}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}