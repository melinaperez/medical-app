"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
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
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isAdmin: false,
  signInWithGoogle: () => {},
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
        router.push("/dashboard")
      })
      .catch((error) => {
        console.error("Error de autenticación:", error)
        let errorMessage = "Error al iniciar sesión con Google"

        // Manejar errores específicos
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

