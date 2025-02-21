import { AuthProvider } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { HeaderLogos } from "@/components/header-logos"
import "./globals.css"
import type React from "react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Aplicación para cálculo de riesgo cardiovascular" />

        {/* PWA tags */}
        <meta name="application-name" content="Prescription Seeding" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prescription Seeding" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Link handling */}
        <meta name="handle_links" content="preferred" />
        <meta name="launch_handler" content='{"client_mode": ["focus-existing", "auto"]}' />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Icons */}
        <link rel="icon" type="image/png" sizes="196x196" href="/icons/favicon-196.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-icon-167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120.png" />
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

