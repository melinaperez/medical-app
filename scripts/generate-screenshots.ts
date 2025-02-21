import { chromium, type Page } from "@playwright/test"
import path from "path"
import fs from "fs"

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000"
const EMAIL = process.env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD

const screenshotsDir = path.join(process.cwd(), "public/screenshots")
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

async function checkServerAvailability(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Server is not responding correctly")
    }
  } catch (error) {
    console.error(`Error: Please make sure your app is running on ${url}`)
    process.exit(1)
  }
}

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    console.warn("⚠️ No credentials provided, skipping login")
    return
  }

  try {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)
    console.log("✅ Login successful")
  } catch (error) {
    console.error("Error during login:", error)
    throw error
  }
}

async function generateScreenshots() {
  console.log(`🔍 Checking server availability at ${BASE_URL}...`)
  await checkServerAvailability(BASE_URL)
  console.log("✅ Server check passed, generating screenshots...")

  const browser = await chromium.launch()

  // Capturas de pantalla de escritorio
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })
  const desktopPage = await desktopContext.newPage()

  // Login si es necesario
  await login(desktopPage)

  const desktopPages = [
    { path: "/dashboard", name: "dashboard", needsAuth: true },
    { path: "/medical-form", name: "medical-form", needsAuth: true },
    { path: "/login", name: "login", needsAuth: false },
  ]

  for (const { path: pagePath, name, needsAuth } of desktopPages) {
    try {
      if (!needsAuth || (EMAIL && PASSWORD)) {
        console.log(`📸 Capturing desktop screenshot for ${name}...`)
        await desktopPage.goto(`${BASE_URL}${pagePath}`)
        // Esperar a que la página esté completamente cargada
        await desktopPage.waitForLoadState("networkidle")
        // Esperar un poco más para animaciones o datos dinámicos
        await desktopPage.waitForTimeout(1000)
        await desktopPage.screenshot({
          path: `${screenshotsDir}/${name}.png`,
          fullPage: false,
        })
        console.log(`✅ Desktop screenshot captured for ${name}`)
      }
    } catch (error) {
      console.error(`Error capturing ${name}:`, error)
    }
  }

  await desktopContext.close()

  // Capturas de pantalla móviles
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()

  // Login para móvil si es necesario
  await login(mobilePage)

  const mobilePages = [
    { path: "/dashboard", name: "dashboard-mobile", needsAuth: true },
    { path: "/login", name: "login-mobile", needsAuth: false },
  ]

  for (const { path: pagePath, name, needsAuth } of mobilePages) {
    try {
      if (!needsAuth || (EMAIL && PASSWORD)) {
        console.log(`📸 Capturing mobile screenshot for ${name}...`)
        await mobilePage.goto(`${BASE_URL}${pagePath}`)
        await mobilePage.waitForLoadState("networkidle")
        await mobilePage.waitForTimeout(1000)
        await mobilePage.screenshot({
          path: `${screenshotsDir}/${name}.png`,
          fullPage: false,
        })
        console.log(`✅ Mobile screenshot captured for ${name}`)
      }
    } catch (error) {
      console.error(`Error capturing ${name}:`, error)
    }
  }

  await mobileContext.close()
  await browser.close()
  console.log("✅ All screenshots generated successfully")
}

// Ejecutar la función y manejar errores
generateScreenshots().catch((error) => {
  console.error("Error generating screenshots:", error)
  process.exit(1)
})

