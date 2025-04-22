"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CountryFlag } from "@/components/country-flag"

interface DoctorCount {
  nombre: string
  email: string
  count: number
}

interface CountryData {
  code: string
  name: string
  value: number
  doctors?: DoctorCount[]
}

interface CountryCardsProps {
  data: CountryData[]
}

export function CountryCards({ data }: CountryCardsProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Ordenar los países por valor (de mayor a menor)
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  // Encontrar el valor máximo para calcular porcentajes
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" onMouseMove={handleMouseMove}>
      {sortedData.map((country) => {
        // Calcular el porcentaje para la intensidad del color de fondo
        const percentage = (country.value / maxValue) * 100
        // Calcular el color de fondo basado en el porcentaje
        const bgColor = `rgba(59, 130, 246, ${(percentage / 100) * 0.3})`

        return (
          <Card
            key={country.code}
            className="overflow-hidden relative cursor-pointer"
            style={{ backgroundColor: bgColor }}
            onMouseEnter={() => setHoveredCountry(country.code)}
            onMouseLeave={() => setHoveredCountry(null)}
          >
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CountryFlag countryCode={country.code} size="lg" />
                  <div>
                    <h3 className="font-medium text-lg">{country.name}</h3>
                  </div>
                </div>
                <div className="text-2xl font-bold">{country.value}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Tooltip que muestra los doctores */}
      {hoveredCountry && (
        <>
          {sortedData.find((country) => country.code === hoveredCountry)?.doctors?.length ? (
            <div
              className="fixed bg-white p-4 rounded-lg border shadow-lg z-50 max-w-xs max-h-80 overflow-auto"
              style={{
                left: `${tooltipPosition.x + 15}px`,
                top: `${tooltipPosition.y - 20}px`,
                transform: "translateY(-50%)",
              }}
            >
              <h4 className="font-medium text-sm mb-2 border-b pb-1">
                Médicos en {sortedData.find((country) => country.code === hoveredCountry)?.name}:
              </h4>
              <ul className="text-sm space-y-2">
                {sortedData
                  .find((country) => country.code === hoveredCountry)
                  ?.doctors?.map((doctor, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="truncate mr-4 font-medium">{doctor.nombre}</span>
                      <span className="whitespace-nowrap text-blue-600 font-semibold">{doctor.count} pacientes</span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
