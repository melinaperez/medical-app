"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Activity } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PatientData {
  nombre: string
  apellido: string
  genero: string
  edad: number
  colesterol: number
  presionArterial: string
  score: number
  createdAt: any
}

interface ScoreDistribution {
  range: string
  count: number
}

interface DashboardStats {
  totalPatients: number
  maleCount: number
  femaleCount: number
  averageScore: number
  genderData: { name: string; value: number }[]
  scoreDistribution: ScoreDistribution[]
  recentPatients: PatientData[]
}

const initialStats: DashboardStats = {
  totalPatients: 0,
  maleCount: 0,
  femaleCount: 0,
  averageScore: 0,
  genderData: [],
  scoreDistribution: [],
  recentPatients: [],
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(initialStats)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        const patientsRef = collection(db, "patients")
        const querySnapshot = await getDocs(query(patientsRef))

        let total = 0
        let male = 0
        let female = 0
        let totalScore = 0
        const scores: number[] = []
        const patients: PatientData[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as PatientData
          total++
          if (data.genero === "masculino") male++
          if (data.genero === "femenino") female++
          if (data.score) {
            totalScore += data.score
            scores.push(data.score)
          }
          patients.push(data)
        })

        // Calculate score distribution
        const scoreRanges = [
          { min: 0, max: 20, label: "0-20" },
          { min: 21, max: 40, label: "21-40" },
          { min: 41, max: 60, label: "41-60" },
          { min: 61, max: 80, label: "61-80" },
          { min: 81, max: 100, label: "81-100" },
        ]

        const distribution = scoreRanges.map((range) => ({
          range: range.label,
          count: scores.filter((score) => score >= range.min && score <= range.max).length,
        }))

        // Sort patients by date and get the 5 most recent
        const recentPatients = patients.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 5)

        setStats({
          totalPatients: total,
          maleCount: male,
          femaleCount: female,
          averageScore: total > 0 ? Math.round(totalScore / total) : 0,
          genderData: [
            { name: "Masculino", value: male },
            { name: "Femenino", value: female },
          ],
          scoreDistribution: distribution,
          recentPatients,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, router])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#FF8042"]

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Bienvenido, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/medical-form")} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Paciente
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Cerrar sesión
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Masculinos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maleCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Femeninos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.femaleCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Género</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {stats.genderData.length > 0 ? (
                <div className="w-[300px] h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.genderData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Scores</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {stats.scoreDistribution.length > 0 ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPatients.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">Nombre</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Género</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Edad</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Colesterol</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Presión Arterial</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPatients.map((patient, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">{`${patient.nombre} ${patient.apellido}`}</td>
                        <td className="p-4 capitalize">{patient.genero}</td>
                        <td className="p-4">{patient.edad}</td>
                        <td className="p-4">{patient.colesterol}</td>
                        <td className="p-4">{patient.presionArterial}</td>
                        <td className="p-4">{patient.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay pacientes registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

