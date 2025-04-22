"use client"

import { useState } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { Tooltip as ReactTooltip } from "react-tooltip"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { scaleLinear } from "d3-scale"

interface CountryData {
  code: string
  name: string
  value: number
}

interface CountryMapProps {
  data: CountryData[]
}

// Mapa de códigos ISO2 a ISO3 para los países de interés
const ISO2_TO_ISO3: Record<string, string> = {
  AR: "ARG", // Argentina
  CL: "CHL", // Chile
  CO: "COL", // Colombia
  EC: "ECU", // Ecuador
  MX: "MEX", // México
  PE: "PER", // Perú
}

// URL del mapa TopoJSON de América del Sur
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json"

export function CountryMap({ data }: CountryMapProps) {
  const [tooltipContent, setTooltipContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Crear una escala de colores basada en los valores de los datos
  const maxValue = Math.max(...data.map((d) => d.value))
  const colorScale = scaleLinear<string>().domain([0, maxValue]).range(["#e6f2ff", "#0066cc"]) // Azul claro a azul oscuro

  return (
    <div className="relative">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto h-[500px] border rounded-lg overflow-hidden">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 400,
              center: [-60, -15], // Centrado en América del Sur
            }}
          >
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    // Obtener el código ISO3 del país
                    const iso3 = geo.properties.iso_a3

                    // Encontrar el código ISO2 correspondiente
                    const iso2 = Object.keys(ISO2_TO_ISO3).find((key) => ISO2_TO_ISO3[key] === iso3)

                    // Buscar los datos del país
                    const countryData = iso2 ? data.find((d) => d.code === iso2) : null

                    // Determinar el color basado en los datos
                    const fillColor = countryData ? colorScale(countryData.value) : "#F5F4F6"

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColor}
                        stroke="#D6D6DA"
                        style={{
                          default: { outline: "none" },
                          hover: {
                            fill: countryData ? "#3b82f6" : "#F5F4F6",
                            outline: "none",
                            stroke: "#000",
                            strokeWidth: 1,
                          },
                          pressed: { outline: "none" },
                        }}
                        data-tooltip-id="country-tooltip"
                        onMouseEnter={() => {
                          if (countryData) {
                            setTooltipContent(`
                              <div class="font-bold text-base mb-1">${countryData.name}</div>
                              <div class="flex items-center justify-center mb-1">
                                <span class="text-2xl mr-2">
                                  ${
                                    countryData.code === "AR"
                                      ? "🇦🇷"
                                      : countryData.code === "CL"
                                        ? "🇨🇱"
                                        : countryData.code === "CO"
                                          ? "🇨🇴"
                                          : countryData.code === "EC"
                                            ? "🇪🇨"
                                            : countryData.code === "MX"
                                              ? "🇲🇽"
                                              : countryData.code === "PE"
                                                ? "🇵🇪"
                                                : ""
                                  }
                                </span>
                              </div>
                              <div class="font-bold text-blue-600">
                                <span class="text-lg">${countryData.value}</span> pacientes
                              </div>
                            `)
                          } else {
                            setTooltipContent("")
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltipContent("")
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          <ReactTooltip
            id="country-tooltip"
            render={() => (
              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-lg">
                <div dangerouslySetInnerHTML={{ __html: tooltipContent }} />
              </div>
            )}
            className="z-50"
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Leyenda</h3>
        <div className="flex items-center space-x-2">
          <div className="w-full h-4 bg-gradient-to-r from-[#e6f2ff] to-[#0066cc] rounded"></div>
          <div className="flex justify-between w-full text-sm text-gray-600">
            <span>0</span>
            <span>{Math.round(maxValue / 2)}</span>
            <span>{maxValue}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((country) => (
          <Card key={country.code} className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {country.code === "AR" && "🇦🇷"}
                {country.code === "CL" && "🇨🇱"}
                {country.code === "CO" && "🇨🇴"}
                {country.code === "EC" && "🇪🇨"}
                {country.code === "MX" && "🇲🇽"}
                {country.code === "PE" && "🇵🇪"}
              </span>
              <span>{country.name}</span>
            </div>
            <span className="font-bold">{country.value}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}
