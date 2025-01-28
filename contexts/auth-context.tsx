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

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: "select_account",
    })

    try {
      console.log("Starting Google sign in...")
      console.log("Current auth domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
      const result = await signInWithPopup(auth, provider)
      console.log("Sign in successful:", result.user.email)
    } catch (error: any) {
      console.error("Detailed sign in error:", error)

      let errorMessage = "Error al iniciar sesión con Google"
      if (error.code === "auth/unauthorized-domain") {
        errorMessage = `Dominio no autorizado. Por favor, asegúrese de que ${window.location.origin} esté agregado en la configuración de Firebase.`
      }

      setError(errorMessage)
      console.error("Error signing in with Google:", {
        code: error.code,
        message: error.message,
        domain: window.location.origin,
      })
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Error al cerrar sesión")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

