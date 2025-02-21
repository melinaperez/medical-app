"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function ProtocolHandler() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const action = searchParams.get("action")
    const data = searchParams.get("data")

    if (action) {
      handleAction(action)
    } else if (data) {
      handleData(data)
    }
  }, [user, searchParams, router])

  const handleAction = (action: string) => {
    try {
      const decodedAction = decodeURIComponent(action)
      const [command, ...params] = decodedAction.split("/")

      switch (command) {
        case "new-patient":
          router.push("/medical-form")
          break
        case "view-patient":
          if (params[0]) {
            router.push(`/patient/${params[0]}`)
          }
          break
        case "dashboard":
          router.push("/dashboard")
          break
        default:
          toast({
            variant: "destructive",
            title: "Error",
            description: "Acción no reconocida",
          })
      }
    } catch (error) {
      console.error("Error handling protocol action:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar la acción",
      })
    }
  }

  const handleData = (data: string) => {
    try {
      const decodedData = decodeURIComponent(data)
      const parsedData = JSON.parse(decodedData)

      // Manejar diferentes tipos de datos
      switch (parsedData.type) {
        case "patient":
          // Prellenar el formulario con datos del paciente
          // Usamos URLSearchParams para construir la query string
          const searchParams = new URLSearchParams()
          searchParams.set("data", decodedData)
          router.push(`/medical-form?${searchParams.toString()}`)
          break
        case "report":
          // Mostrar un reporte específico
          router.push(`/reports/${parsedData.id}`)
          break
        default:
          toast({
            variant: "destructive",
            title: "Error",
            description: "Tipo de datos no reconocido",
          })
      }
    } catch (error) {
      console.error("Error handling protocol data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar los datos",
      })
    }
  }

  return null // Esta página no necesita renderizar nada
}

