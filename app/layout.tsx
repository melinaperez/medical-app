import { AuthProvider } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { HeaderLogos } from "@/components/header-logos"
import "./globals.css"
import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Prescription Seeding",
  description: "Aplicación para cálculo de riesgo cardiovascular",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-196.png", sizes: "196x196", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prescription Seeding",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "Prescription Seeding",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="handle_links" content="preferred" />
        <meta name="launch_handler" content='{"client_mode": ["focus-existing", "auto"]}' />
      </head>
      <body>
        <AuthProvider>
          <NotificationProvider>
            <div className="layout-container">
              <HeaderLogos />
              {children}
              <Toaster />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

