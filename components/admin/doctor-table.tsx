"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryFlag } from "@/components/country-flag"

interface Doctor {
  id: string
  nombre: string
  pais: string
  email: string
  pacientesCount?: number
}

interface DoctorTableProps {
  doctors: Doctor[]
}

export function DoctorTable({ doctors }: DoctorTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<"nombre" | "pais" | "pacientesCount">("pacientesCount")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort doctors
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortBy === "pacientesCount") {
      const countA = a.pacientesCount || 0
      const countB = b.pacientesCount || 0
      return sortDirection === "asc" ? countA - countB : countB - countA
    } else {
      const valueA = a[sortBy].toLowerCase()
      const valueB = b[sortBy].toLowerCase()
      return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedDoctors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDoctors = sortedDoctors.slice(startIndex, endIndex)

  // Country code to name mapping
  const countryNames: Record<string, string> = {
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    EC: "Ecuador",
    MX: "México",
    PE: "Perú",
  }

  const handleSort = (column: "nombre" | "pais" | "pacientesCount") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("nombre")}>
                Nombre
                {sortBy === "nombre" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("pais")}>
                País
                {sortBy === "pais" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("pacientesCount")}
              >
                Pacientes
                {sortBy === "pacientesCount" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDoctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">{doctor.nombre}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CountryFlag countryCode={doctor.pais} size="sm" />
                    <span>{countryNames[doctor.pais] || doctor.pais}</span>
                  </div>
                </TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell className="text-right">{doctor.pacientesCount || 0}</TableCell>
              </TableRow>
            ))}
            {currentDoctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No se encontraron médicos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 50].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Página {currentPage} de {totalPages || 1}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
