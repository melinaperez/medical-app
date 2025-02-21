"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function ImportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    // Obtener el archivo del sistema de archivos
    if ("launchQueue" in window) {
      ;(window as any).launchQueue.setConsumer(async (launchParams: { files: FileSystemFileHandle[] }) => {
        if (!launchParams.files.length) return

        try {
          const fileHandle = launchParams.files[0]
          const file = await fileHandle.getFile()
          setFile(file)
        } catch (error) {
          console.error("Error al abrir el archivo:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo abrir el archivo",
          })
        }
      })
    }
  }, [toast])

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const rows = text.split("\n").map((row) => row.split(","))

      // Aquí procesarías los datos según tu necesidad
      console.log("Datos importados:", rows)

      toast({
        title: "Éxito",
        description: "Archivo importado correctamente",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error al importar:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar el archivo",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Importar Datos</CardTitle>
        </CardHeader>
        <CardContent>
          {file ? (
            <div className="space-y-4">
              <p>Archivo seleccionado: {file.name}</p>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? "Importando..." : "Importar"}
              </Button>
            </div>
          ) : (
            <p>Esperando archivo...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

