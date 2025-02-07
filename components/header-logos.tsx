"use client"

import { usePathname } from "next/navigation"

export function HeaderLogos() {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <div className="w-full bg-transparent py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-bold">Avalado por</span>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20SIAC-DsDIlzruf2j0q1sMlIu17kE4OObK1o.png"
              alt="SIAC Logo"
              className={`object-contain ${isLoginPage ? "h-16" : "h-12"}`}
            />
          </div>

          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20MODO.PNG-QlDepBjikleiBpUHZw8FRGjwB43hLV.png"
            alt="MODO Logo"
            className={`object-contain ${isLoginPage ? "h-20" : "h-16"}`}
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-bold">Patrocinado por</span>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20OMRON.jpg-9jx8eDDFBRgCr8tEuLj0DVWtS6h7JQ.jpeg"
              alt="OMRON Logo"
              className={`object-contain ${isLoginPage ? "h-14" : "h-10"}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

