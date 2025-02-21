import sharp from "sharp"
import fs from "fs"
import path from "path"

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputIcon = "public/icon-512x512.png"

// Asegurarse de que el directorio de iconos existe
const iconsDir = path.join(process.cwd(), "public/icons")
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generar iconos regulares
async function generateRegularIcons() {
  for (const size of sizes) {
    await sharp(inputIcon)
      .resize(size, size)
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
  }
}

// Generar iconos maskable
// Los iconos maskable necesitan un padding extra para la "safe zone"
async function generateMaskableIcons() {
  for (const size of sizes) {
    // Calcular el tamaño interno para mantener la "safe zone" de los iconos maskable
    const safeSize = Math.floor(size * 0.8) // 80% del tamaño total para la "safe zone"
    const padding = Math.floor((size - safeSize) / 2)

    await sharp(inputIcon)
      .resize(safeSize, safeSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fondo blanco
      })
      .toFile(path.join(iconsDir, `maskable-${size}x${size}.png`))
  }
}

// Generar iconos para shortcuts
async function generateShortcutIcons() {
  await sharp(inputIcon).resize(192, 192).toFile(path.join(iconsDir, "shortcut-new-192.png"))

  await sharp(inputIcon).resize(192, 192).toFile(path.join(iconsDir, "shortcut-dashboard-192.png"))
}

// Ejecutar todas las generaciones
async function generateAllIcons() {
  try {
    await generateRegularIcons()
    console.log("✅ Iconos regulares generados")

    await generateMaskableIcons()
    console.log("✅ Iconos maskable generados")

    await generateShortcutIcons()
    console.log("✅ Iconos de shortcuts generados")
  } catch (error) {
    console.error("Error generando iconos:", error)
  }
}

generateAllIcons()

