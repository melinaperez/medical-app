"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect } from "react"
import { GoogleIcon } from "@/components/ui/google-icon"

const isValidEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  return emailRegex.test(email)
}

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!email || !password) {
      setLocalError("Por favor, completa todos los campos")
      return
    }

    if (!isValidEmail(email)) {
      setLocalError("Por favor, ingresa un email válido")
      return
    }

    setIsLoading(true)
    setLocalError(null)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setShowVerificationMessage(true)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, isSignUp: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleEmailAuth(isSignUp)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Prescription Seeding</CardTitle>
          <CardDescription>Inicie sesión o regístrese para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input
                  id="email-login"
                  type="email"
                  pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, false)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Contraseña</Label>
                <Input
                  id="password-login"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, false)}
                />
              </div>
              <Button type="button" className="w-full" onClick={() => handleEmailAuth(false)} disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-register">Email</Label>
                <Input
                  id="email-register"
                  type="email"
                  pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, true)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Contraseña</Label>
                <Input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, true)}
                />
              </div>
              <Button type="button" className="w-full" onClick={() => handleEmailAuth(true)} disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrarse"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúe con</span>
            </div>
          </div>

          <Button type="button" onClick={() => signInWithGoogle()} className="w-full" variant="outline">
            <GoogleIcon className="mr-2 h-4 w-4" />
            Iniciar sesión con Google
          </Button>

          {(error || localError) && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error || localError}</AlertDescription>
            </Alert>
          )}

          {showVerificationMessage && (
            <Alert className="mt-4">
              <AlertDescription>
                Te hemos enviado un email de verificación. Por favor, verifica tu cuenta antes de iniciar sesión.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}