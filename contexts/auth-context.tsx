"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  sendEmailVerification,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { isAdminEmail } from "@/lib/roles"

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  signInWithGoogle: () => void
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isAdmin: false,
  signInWithGoogle: () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resendVerificationEmail: async () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsAdmin(isAdminEmail(user?.email))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: "select_account",
    })

    signInWithPopup(auth, provider)
      .then((result) => {
        // Los usuarios de Google se consideran verificados automáticamente
        router.push("/dashboard")
      })
      .catch((error) => {
        console.error("Error de autenticación:", error)
        let errorMessage = "Error al iniciar sesión con Google"

        if (error.code === "auth/unauthorized-domain") {
          errorMessage = "Este dominio no está autorizado para iniciar sesión. Por favor, contacta al administrador."
        } else if (error.code === "auth/popup-closed-by-user") {
          errorMessage = "Se cerró la ventana de inicio de sesión. Por favor, intenta nuevamente."
        } else if (error.code === "auth/cancelled-popup-request") {
          errorMessage = "Se canceló la solicitud de inicio de sesión. Por favor, intenta nuevamente."
        }

        setError(errorMessage)
      })
  }

  async function signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth)
        setError("Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.")
        return
      }

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)
      let errorMessage = "Error al iniciar sesión"

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Email o contraseña incorrectos"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido"
      }

      setError(errorMessage)
      throw error
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Enviar email de verificación
      await sendEmailVerification(userCredential.user)

      // Cerrar sesión hasta que verifique el email
      await firebaseSignOut(auth)

      setError("Te hemos enviado un email de verificación. Por favor, verifica tu cuenta antes de iniciar sesión.")
    } catch (error: any) {
      console.error("Error de registro:", error)
      let errorMessage = "Error al registrarse"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email ya está registrado"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña debe tener al menos 6 caracteres"
      }

      setError(errorMessage)
      throw error
    }
  }

  async function resendVerificationEmail() {
    if (!user) {
      setError("No hay usuario activo")
      return
    }

    try {
      await sendEmailVerification(user)
      setError("Email de verificación enviado. Por favor, revisa tu bandeja de entrada o spam.")
    } catch (error: any) {
      console.error("Error al reenviar email de verificación:", error)
      setError("Error al enviar el email de verificación")
    }
  }

  function signOut() {
    firebaseSignOut(auth)
      .then(() => {
        router.push("/login")
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error)
        setError("Error al cerrar sesión")
      })
  }

  const value = {
    user,
    loading,
    error,
    isAdmin,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}

