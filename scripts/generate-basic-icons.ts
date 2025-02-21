const sharp = require("sharp")
const path = require("path")

const size = 512
const backgroundColor = "#ffffff"
const iconColor = "#0070f3"

// Crear un SVG básico
const svgIcon = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  <path d="M256 96c-88.366 0-160 71.634-160 160s71.634 160 160 160 160-71.634 160-160S344.366 96 256 96zm0 280c-66.274 0-120-53.726-120-120s53.726-120 120-120 120 53.726 120 120-53.726 120-120 120zm80-150h-60v-60h-40v60h-60v40h60v60h40v-60h60v-40z" fill="${iconColor}"/>
</svg>`

async function generateBasicIcons() {
  try {
    // Generar icono regular
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(process.cwd(), "public", "icon.png"))

    // Generar icono maskable con padding
    const padding = Math.floor(size * 0.1)
    await sharp(Buffer.from(svgIcon))
      .resize(size - padding * 2, size - padding * 2)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(process.cwd(), "public", "icon-maskable.png"))

    console.log("✅ Icons generated successfully")
  } catch (error) {
    console.error("Error generating icons:", error)
    process.exit(1)
  }
}

generateBasicIcons()

