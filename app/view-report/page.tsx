"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function ViewReportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if ("launchQueue" in window) {
      ;(window as any).launchQueue.setConsumer(async (launchParams: { files: FileSystemFileHandle[] }) => {
        if (!launchParams.files.length) return

        try {
          const fileHandle = launchParams.files[0]
          const file = await fileHandle.getFile()
          const url = URL.createObjectURL(file)
          setPdfUrl(url)
        } catch (error) {
          console.error("Error al abrir el PDF:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo abrir el archivo PDF",
          })
        }
      })
    }
  }, [toast])

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Visor de Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-[800px]" title="PDF Viewer" />
          ) : (
            <p>Esperando archivo PDF...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

