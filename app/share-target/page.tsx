"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function ShareTargetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sharedData, setSharedData] = useState<{
    title?: string
    text?: string
    url?: string
    files?: FileList
  }>({})

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Obtener los datos compartidos del formulario
    const handleFormData = async () => {
      try {
        const formData = await (window as any).launchQueue?.getFormData()
        if (formData) {
          const data = {
            title: formData.get("title"),
            text: formData.get("text"),
            url: formData.get("url"),
            files: formData.getAll("reports"),
          }
          setSharedData(data)

          // Mostrar notificación de éxito
          toast({
            title: "Contenido recibido",
            description: "El contenido compartido se ha recibido correctamente",
          })
        }
      } catch (error) {
        console.error("Error processing shared content:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo procesar el contenido compartido",
        })
      } finally {
        setLoading(false)
      }
    }

    handleFormData()
  }, [user, router, toast])

  const handleProcessData = async () => {
    try {
      setLoading(true)

      // Procesar los datos según el tipo
      if (sharedData.files?.length) {
        // Si son archivos PDF, redirigir al visor
        if (sharedData.files[0].type === "application/pdf") {
          router.push(`/view-report?file=${encodeURIComponent(URL.createObjectURL(sharedData.files[0]))}`)
          return
        }

        // Si son archivos CSV, redirigir al importador
        if (sharedData.files[0].type === "text/csv") {
          router.push(`/import?file=${encodeURIComponent(URL.createObjectURL(sharedData.files[0]))}`)
          return
        }
      }

      // Si es una URL o texto, procesar según corresponda
      if (sharedData.url) {
        // Procesar URL
        router.push(`/protocol?action=process-url&url=${encodeURIComponent(sharedData.url)}`)
      } else if (sharedData.text) {
        // Procesar texto
        router.push(`/protocol?action=process-text&text=${encodeURIComponent(sharedData.text)}`)
      }
    } catch (error) {
      console.error("Error processing data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar los datos",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg">Procesando contenido compartido...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Contenido Compartido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sharedData.title && (
            <div>
              <h3 className="font-medium">Título:</h3>
              <p>{sharedData.title}</p>
            </div>
          )}

          {sharedData.text && (
            <div>
              <h3 className="font-medium">Texto:</h3>
              <p>{sharedData.text}</p>
            </div>
          )}

          {sharedData.url && (
            <div>
              <h3 className="font-medium">URL:</h3>
              <p>{sharedData.url}</p>
            </div>
          )}

          {sharedData.files?.length ? (
            <div>
              <h3 className="font-medium">Archivos:</h3>
              <ul className="list-disc pl-5">
                {Array.from(sharedData.files).map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleProcessData} disabled={loading}>
              Procesar Contenido
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

