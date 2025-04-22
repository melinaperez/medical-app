"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { es } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CountryCards } from "@/components/admin/country-cards"
import { DoctorTable } from "@/components/admin/doctor-table"
import { WeeklyChart } from "@/components/admin/weekly-chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Añadir el import para el ícono de Users
import { Users } from "lucide-react"

interface Doctor {
  id: string
  nombre: string
  pais: string
  email: string
  pacientesCount?: number
}

// Modificar la interfaz PatientsByCountry para incluir información de doctores
interface PatientsByCountry {
  code: string
  name: string
  value: number
  doctors?: { nombre: string; email: string; count: number }[]
}

interface PatientsByWeek {
  week: string
  count: number
  startDate: string
  endDate: string
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patientsByCountry, setPatientsByCountry] = useState<PatientsByCountry[]>([])
  const [patientsByWeek, setPatientsByWeek] = useState<PatientsByWeek[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!isAdmin) {
      router.push("/dashboard")
      return
    }

    // En la función fetchData, modificar la parte donde se procesan los datos por país
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch doctors
        const doctorsRef = collection(db, "doctors")
        const doctorsSnapshot = await getDocs(doctorsRef)
        const doctorsData: Doctor[] = doctorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Doctor, "id">),
        }))

        // Fetch patients
        const patientsRef = collection(db, "patients")
        const patientsSnapshot = await getDocs(patientsRef)
        const patients = patientsSnapshot.docs.map((doc) => doc.data())

        // Count patients by doctor
        const doctorCounts: Record<string, number> = {}
        patients.forEach((patient) => {
          const doctorEmail = patient.doctorEmail
          if (doctorEmail) {
            doctorCounts[doctorEmail] = (doctorCounts[doctorEmail] || 0) + 1
          }
        })

        // Add patient counts to doctors
        const doctorsWithCounts = doctorsData.map((doctor) => ({
          ...doctor,
          pacientesCount: doctorCounts[doctor.email] || 0,
        }))
        setDoctors(doctorsWithCounts)

        // Count patients by country and doctor
        const countryCounts: Record<string, number> = {}
        const countryDoctorCounts: Record<string, Record<string, number>> = {}

        patients.forEach((patient) => {
          const country = patient.pais
          const doctorEmail = patient.doctorEmail

          if (country) {
            // Increment country count
            countryCounts[country] = (countryCounts[country] || 0) + 1

            // Initialize country-doctor mapping if needed
            if (!countryDoctorCounts[country]) {
              countryDoctorCounts[country] = {}
            }

            // Increment doctor count for this country
            if (doctorEmail) {
              countryDoctorCounts[country][doctorEmail] = (countryDoctorCounts[country][doctorEmail] || 0) + 1
            }
          }
        })

        // Map country codes to names
        const countryNames: Record<string, string> = {
          AR: "Argentina",
          CL: "Chile",
          CO: "Colombia",
          EC: "Ecuador",
          MX: "México",
          PE: "Perú",
        }

        // Create a mapping of doctor emails to names
        const doctorEmailToName: Record<string, string> = {}
        doctorsData.forEach((doctor) => {
          doctorEmailToName[doctor.email] = doctor.nombre
        })

        const countryData = Object.entries(countryCounts).map(([code, value]) => {
          // Get doctor counts for this country
          const doctorCounts = countryDoctorCounts[code] || {}

          // Convert to array of doctor counts
          const doctors = Object.entries(doctorCounts)
            .map(([email, count]) => ({
              email,
              nombre: doctorEmailToName[email] || email,
              count,
            }))
            .sort((a, b) => b.count - a.count) // Sort by count descending

          return {
            code,
            name: countryNames[code] || code,
            value,
            doctors,
          }
        })

        setPatientsByCountry(countryData)

        // Count patients by week
        const now = new Date()
        const weekData: PatientsByWeek[] = []

        // Get data for the last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }) // Monday as week start
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

          // Count patients created in this week
          const weekCount = patients.filter((patient) => {
            if (!patient.createdAt) return false
            const createdAt = patient.createdAt?.toDate ? patient.createdAt.toDate() : new Date(patient.createdAt)
            return createdAt >= weekStart && createdAt <= weekEnd
          }).length

          weekData.push({
            week: `Semana ${format(weekStart, "w")}`,
            count: weekCount,
            startDate: format(weekStart, "dd/MM", { locale: es }),
            endDate: format(weekEnd, "dd/MM", { locale: es }),
          })
        }

        setPatientsByWeek(weekData)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(
          "Error al cargar los datos: Permisos insuficientes. Asegúrese de que las reglas de seguridad de Firestore permitan el acceso a las colecciones necesarias.",
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modificar la sección de botones en el header para incluir el enlace a la gestión de usuarios */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">Bienvenido, {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/admin/users")} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gestionar Administradores
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="weekly">Pacientes por Semana</TabsTrigger>
            <TabsTrigger value="doctors">Pacientes por Médico</TabsTrigger>
            <TabsTrigger value="countries">Pacientes por País</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pacientes dados de alta por semana</CardTitle>
              </CardHeader>
              <CardContent>
                {patientsByWeek.length > 0 ? (
                  <div className="w-full">
                    <div className="mb-4 text-sm text-muted-foreground">
                      Pase el cursor sobre las barras para ver más detalles
                    </div>
                    <WeeklyChart data={patientsByWeek} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pacientes dados de alta por médico</CardTitle>
              </CardHeader>
              <CardContent>
                {doctors.length > 0 ? (
                  <DoctorTable doctors={doctors} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No hay datos de médicos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pacientes dados de alta por país</CardTitle>
              </CardHeader>
              <CardContent>
                {patientsByCountry.length > 0 ? (
                  <CountryCards data={patientsByCountry} />
                ) : (
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
