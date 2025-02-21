"use client"

import { useEffect } from "react"
import { redirect } from "next/navigation"
import { registerServiceWorker } from "./register-sw"

export default function Home() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  redirect("/login")
  return null
}