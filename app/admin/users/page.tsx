"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminUser {
  id: string
  email: string
  addedAt: Date
}

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!isAdmin) {
      router.push("/dashboard")
      return
    }

    fetchAdminUsers()
  }, [user, isAdmin, router])

  const fetchAdminUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const adminsRef = collection(db, "admins")
      const querySnapshot = await getDocs(adminsRef)

      const admins: AdminUser[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        admins.push({
          id: doc.id,
          email: data.email || doc.id, // Usar el campo email o el ID como respaldo
          addedAt: data.addedAt?.toDate() || new Date(),
        })
      })

      setAdminUsers(admins)
    } catch (error) {
      console.error("Error al cargar administradores:", error)
      setError("Error al cargar la lista de administradores")
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAdminEmail.trim()) {
      setError("Por favor, ingresa un email válido")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Verificar si ya existe
      const existingAdmin = adminUsers.find((admin) => admin.email === newAdminEmail)
      if (existingAdmin) {
        setError("Este email ya está registrado como administrador")
        return
      }

      // Usar setDoc con el email como ID del documento
      const adminDocRef = doc(db, "admins", newAdminEmail)
      await setDoc(adminDocRef, {
        email: newAdminEmail,
        addedAt: new Date(),
        addedBy: user?.email,
      })

      toast({
        title: "Administrador añadido",
        description: `${newAdminEmail} ahora tiene permisos de administrador`,
      })

      setNewAdminEmail("")
      fetchAdminUsers()
    } catch (error) {
      console.error("Error al añadir administrador:", error)
      setError("Error al añadir administrador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    // No permitir eliminar al usuario actual
    if (adminId === user?.email) {
      setError("No puedes eliminar tu propio usuario administrador")
      return
    }

    try {
      await deleteDoc(doc(db, "admins", adminId))

      toast({
        title: "Administrador eliminado",
        description: `${adminId} ya no tiene permisos de administrador`,
      })

      fetchAdminUsers()
    } catch (error) {
      console.error("Error al eliminar administrador:", error)
      setError("Error al eliminar administrador")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Administradores</h1>
            <p className="text-sm text-muted-foreground mt-1">Administra los usuarios con permisos de administrador</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            Volver al Dashboard
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Añadir Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdmin} className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="admin-email">Email del nuevo administrador</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Añadiendo..." : "Añadir"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administradores Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            {adminUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={admin.email === user?.email}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No hay administradores registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
