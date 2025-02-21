import sharp from "sharp"
import fs from "fs"
import path from "path"

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputIcon = path.join(process.cwd(), "public/base-icon.svg")
const iconsDir = path.join(process.cwd(), "public/icons")

// Asegurarse de que el directorio de iconos existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

async function generateIcons() {
  try {
    console.log("🎨 Generating icons...")

    // Generar iconos regulares
    for (const size of sizes) {
      await sharp(inputIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
      console.log(`✅ Generated icon-${size}x${size}.png`)
    }

    // Generar iconos maskable
    for (const size of sizes) {
      // Para iconos maskable, agregamos padding del 10% para la "safe zone"
      const padding = Math.floor(size * 0.1)
      await sharp(inputIcon)
        .resize(size - padding * 2, size - padding * 2)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toFile(path.join(iconsDir, `maskable-${size}x${size}.png`))
      console.log(`✅ Generated maskable-${size}x${size}.png`)
    }

    // Generar iconos para shortcuts
    await sharp(inputIcon).resize(192, 192).png().toFile(path.join(iconsDir, `shortcut-new-192.png`))
    console.log("✅ Generated shortcut icon")

    await sharp(inputIcon).resize(192, 192).png().toFile(path.join(iconsDir, `shortcut-dashboard-192.png`))
    console.log("✅ Generated dashboard shortcut icon")

    console.log("✅ All icons generated successfully!")
  } catch (error) {
    console.error("Error generating icons:", error)
    process.exit(1)
  }
}

generateIcons()

