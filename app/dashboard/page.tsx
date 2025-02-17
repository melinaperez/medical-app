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
  presionSistolica: number
  hipertensionArterial: string
  tabaquismo: string
  imc: string
  apneaSueno: string
  usoAlcohol: string
  insuficienciaCardiaca: string
  enfermedadCoronaria: string
  enfermedadRenal: string
  harms2afScore: number
  mtaiwanScore: number
  frailScore: number
  frailInterpretation: string
  heartsScore: number | null
  heartsRiskLevel: string | null
  heartsRiskColor: string | null
  createdAt: any
  doctorId: string
  doctorEmail: string
  colesterolTotal: number
}

interface ScoreDistribution {
  range: string
  harms2af: number
  mtaiwan: number
}

interface DashboardStats {
  totalPatients: number
  maleCount: number
  femaleCount: number
  genderData: { name: string; value: number }[]
  scoreDistribution: ScoreDistribution[]
  allPatients: PatientData[]
}

const initialStats: DashboardStats = {
  totalPatients: 0,
  maleCount: 0,
  femaleCount: 0,
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
        const patients: PatientData[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as PatientData
          total++
          if (data.genero === "M") male++
          if (data.genero === "F") female++
          patients.push(data)
        })

        // Calculate score distribution
        const scoreRanges = [
          { min: 0, max: 2, label: "0-2" },
          { min: 3, max: 5, label: "3-5" },
          { min: 6, max: 8, label: "6-8" },
          { min: 9, max: 11, label: "9-11" },
          { min: 12, max: 14, label: "12-14" },
        ]

        const distribution = scoreRanges.map((range) => ({
          range: range.label,
          harms2af: patients.filter(
            (patient) => patient.harms2afScore >= range.min && patient.harms2afScore <= range.max,
          ).length,
          mtaiwan: patients.filter((patient) => patient.mtaiwanScore >= range.min && patient.mtaiwanScore <= range.max)
            .length,
        }))

        // Sort patients by date
        const sortedPatients = patients.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)

        setStats({
          totalPatients: total,
          maleCount: male,
          femaleCount: female,
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

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (loading) {
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
              Bienvenido, {user?.email}
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
              <CardTitle className="text-sm font-medium">
                Riesgo calculado HARMS<sub>2</sub>
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.allPatients.length > 0
                  ? Math.round(
                    stats.allPatients.reduce((sum, patient) => sum + patient.harms2afScore, 0) /
                    stats.allPatients.length,
                  )
                  : 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riesgo calculado mTaiwan</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.allPatients.length > 0
                  ? Math.round(
                    stats.allPatients.reduce((sum, patient) => sum + patient.mtaiwanScore, 0) /
                    stats.allPatients.length,
                  )
                  : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riesgo calculado HEARTS</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  // Debug log
                  console.log(
                    "HEARTS Scores:",
                    stats.allPatients.map((p) => p.heartsScore),
                  )

                  // Only include patients with valid heartsScore
                  const validPatients = stats.allPatients.filter(
                    (patient) => patient.heartsScore !== null && patient.heartsScore !== undefined,
                  )

                  // Debug log
                  console.log("Valid patients count:", validPatients.length)

                  if (validPatients.length === 0) {
                    return "0%"
                  }

                  const average =
                    validPatients.reduce((sum, patient) => sum + Number(patient.heartsScore), 0) / validPatients.length

                  // Debug log
                  console.log("Calculated average:", average)

                  return `${Math.round(average)}%`
                })()}
              </div>
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
                            {value} (
                            {stats.totalPatients > 0
                              ? (((entry.payload as any).value / stats.totalPatients) * 100).toFixed(0)
                              : 0}
                            %)
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
              <CardTitle>Distribución de Riesgos Calculados</CardTitle>
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
                      <Legend />
                      <Bar dataKey="harms2af" fill="#8884d8" name="HARMS₂-AF" />
                      <Bar dataKey="mtaiwan" fill="#82ca9d" name="mTaiwan-AF" />
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
                        <th className="h-12 px-4 text-left align-middle font-medium">P. Sistólica</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Colesterol total</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">FRAIL</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          HARMS<sub>2</sub>-AF
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">mTaiwan-AF</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">HEARTS</th>
                        {isAdmin && <th className="h-12 px-4 text-left align-middle font-medium">Médico</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentPatients.map((patient, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4">{getDisplayName(patient)}</td>
                          <td className="p-4 capitalize">{patient.genero}</td>
                          <td className="p-4">{patient.edad}</td>
                          <td className="p-4">{patient.presionSistolica}</td>
                          <td className="p-4">{patient.colesterolTotal}</td>
                          <td className="p-4">
                            {patient.frailScore} - {patient.frailInterpretation}
                          </td>
                          <td className="p-4">{patient.harms2afScore}</td>
                          <td className="p-4">{patient.mtaiwanScore}</td>
                          <td className={`p-4 ${patient.heartsRiskColor || "text-foreground"}`}>
                            <span className={patient.heartsRiskColor ? "text-white" : ""}>
                              {patient.heartsScore !== null
                                ? `${patient.heartsScore}% (${patient.heartsRiskLevel})`
                                : "N/A"}
                            </span>
                          </td>
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

