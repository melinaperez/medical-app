import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { HeaderLogos } from "@/components/header-logos"
import "./globals.css"
import type React from "react" // Added import for React

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <HeaderLogos />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}