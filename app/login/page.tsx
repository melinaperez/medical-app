"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const { signInWithGoogle, user, error } = useAuth()
  const router = useRouter()

  if (user) {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sistema Médico</CardTitle>
          <CardDescription>Inicie sesión para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={signInWithGoogle} className="w-full">
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

