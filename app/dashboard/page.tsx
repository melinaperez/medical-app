"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PatientData {
  nombre: string
  apellido: string
  genero: string
  edad: number
  raza: string
  colesterolTotal: number
  colesterolHDL: number
  presionSistolica: number
  tratamientoHipertension: string
  diabetes: string
  fumador: string
  score: number
  createdAt: any
  doctorId: string
  doctorEmail: string
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
  allPatients: PatientData[]
}

const initialStats: DashboardStats = {
  totalPatients: 0,
  maleCount: 0,
  femaleCount: 0,
  averageScore: 0,
  genderData: [],
  scoreDistribution: [],
  allPatients: [],
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export default function DashboardPage() {
  const { user, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const getDisplayName = (patient: PatientData) => {
    if (user?.uid === patient.doctorId) {
      return `${patient.nombre} ${patient.apellido}`
    }
    return "**********"
  }

  // Pagination calculations
  const totalPages = Math.ceil(stats.allPatients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPatients = stats.allPatients.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchStats = async () => {
      try {
        setLoading(true)
        const patientsRef = collection(db, "patients")
        const q = isAdmin ? query(patientsRef) : query(patientsRef, where("doctorId", "==", user.uid))
        const querySnapshot = await getDocs(q)

        let total = 0
        let male = 0
        let female = 0
        let totalScore = 0
        const scores: number[] = []
        const patients: PatientData[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as PatientData
          total++
          if (data.genero === "M") male++
          if (data.genero === "F") female++
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

        // Sort patients by date
        const sortedPatients = patients.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)

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
          allPatients: sortedPatients,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, router, isAdmin])

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
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido, {user.email}
              {isAdmin && <span className="ml-2 text-blue-600">(Administrador)</span>}
            </p>
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
                        label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.genderData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="square"
                        iconSize={10}
                        formatter={(value, entry) => (
                          <span className="text-sm">
                            {value} ({(((entry.payload as any).value / stats.totalPatients) * 100).toFixed(0)}%)
                          </span>
                        )}
                      />
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
            <CardTitle>
              Pacientes
              {isAdmin && <span className="text-sm font-normal text-muted-foreground ml-2">(Todos los pacientes)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.allPatients.length > 0 ? (
              <>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium">Paciente</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Género</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Edad</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Raza</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Col. Total</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Col. HDL</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">P. Sistólica</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Score</th>
                        {isAdmin && <th className="h-12 px-4 text-left align-middle font-medium">Médico</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentPatients.map((patient, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4">{getDisplayName(patient)}</td>
                          <td className="p-4 capitalize">{patient.genero}</td>
                          <td className="p-4">{patient.edad}</td>
                          <td className="p-4">{patient.raza}</td>
                          <td className="p-4">{patient.colesterolTotal}</td>
                          <td className="p-4">{patient.colesterolHDL}</td>
                          <td className="p-4">{patient.presionSistolica}</td>
                          <td className="p-4">{patient.score}</td>
                          {isAdmin && <td className="p-4">{patient.doctorEmail}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Filas por página</p>
                    <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {ITEMS_PER_PAGE_OPTIONS.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                      Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No hay pacientes registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

