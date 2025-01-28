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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface PatientData {
  nombre: string
  apellido: string
  genero: string
  edad: string
  colesterol: string
  presionArterial: string
}

const initialFormData: PatientData = {
  nombre: "",
  apellido: "",
  genero: "",
  edad: "",
  colesterol: "",
  presionArterial: "",
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

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      genero: value,
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
          colesterol: Number.parseInt(data.colesterol),
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

      // Validate all fields are present
      const emptyFields = Object.entries(formData)
        .filter(([_, value]) => !value)
        .map(([key]) => key)

      if (emptyFields.length > 0) {
        throw new Error(`Los siguientes campos son requeridos: ${emptyFields.join(", ")}`)
      }

      console.log("Saving patient data:", formData)

      // Calculate score
      const calculatedScore = await calculateScore(formData)
      console.log("Calculated score:", calculatedScore)
      setScore(calculatedScore)

      // Prepare data for Firestore
      const patientData = {
        ...formData,
        edad: Number.parseInt(formData.edad),
        colesterol: Number.parseInt(formData.colesterol),
        score: calculatedScore,
        doctorId: user.uid,
        doctorEmail: user.email,
        createdAt: serverTimestamp(),
      }

      console.log("Attempting to save to Firestore:", patientData)

      // Save to Firebase
      const patientsRef = collection(db, "patients")
      const docRef = await addDoc(patientsRef, patientData)

      console.log("Document saved successfully with ID:", docRef.id)

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genero">Género</Label>
                <Select value={formData.genero} onValueChange={handleGenderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colesterol">Nivel de Colesterol (mg/dL)</Label>
                <Input
                  id="colesterol"
                  name="colesterol"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.colesterol}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presionArterial">Presión Arterial (ej: 120/80)</Label>
                <Input
                  id="presionArterial"
                  name="presionArterial"
                  pattern="\d{2,3}\/\d{2,3}"
                  placeholder="120/80"
                  value={formData.presionArterial}
                  onChange={handleInputChange}
                  required
                />
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

