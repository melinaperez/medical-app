const sharp = require("sharp")
const path = require("path")

interface IconSizes {
  favicon: number[]
  apple: number[]
  pwa: number[]
}

interface SharpOptions {
  top: number
  bottom: number
  left: number
  right: number
  background: {
    r: number
    g: number
    b: number
    alpha: number
  }
}

const backgroundColor: string = "#ffffff"
const iconColor: string = "#0070f3"

// Definir todos los tamaños necesarios
const sizes: IconSizes = {
  favicon: [196],
  apple: [120, 152, 167, 180],
  pwa: [512],
}

// Crear un SVG básico (función helper)
function createSvgIcon(size: number): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <path transform="scale(${size / 512})" d="M256 96c-88.366 0-160 71.634-160 160s71.634 160 160 160 160-71.634 160-160S344.366 96 256 96zm0 280c-66.274 0-120-53.726-120-120s53.726-120 120-120 120 53.726 120 120-53.726 120-120 120zm80-150h-60v-60h-40v60h-60v40h60v60h40v-60h60v-40z" fill="${iconColor}"/>
    </svg>`
}

async function generateIcon(sharpInstance: any, outputPath: string): Promise<void> {
  await sharpInstance.png().toFile(path.join(process.cwd(), "public", outputPath))
  console.log(`✅ Generated ${outputPath}`)
}

async function generateBasicIcons(): Promise<void> {
  try {
    // Generar favicon
    for (const size of sizes.favicon) {
      await generateIcon(sharp(Buffer.from(createSvgIcon(size))), `favicon-${size}.png`)
    }

    // Generar iconos de Apple
    for (const size of sizes.apple) {
      await generateIcon(sharp(Buffer.from(createSvgIcon(size))), `apple-icon-${size}.png`)
    }

    // Generar iconos PWA
    for (const size of sizes.pwa) {
      // Icono regular
      await generateIcon(sharp(Buffer.from(createSvgIcon(size))), "icon.png")

      // Icono maskable (con padding)
      const padding = Math.floor(size * 0.1)
      const extendOptions: SharpOptions = {
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      }

      await generateIcon(
        sharp(Buffer.from(createSvgIcon(size - padding * 2))).extend(extendOptions),
        "icon-maskable.png",
      )
    }

    // Generar favicon.ico
    await generateIcon(sharp(Buffer.from(createSvgIcon(256))).resize(256, 256), "favicon.ico")

    console.log("✅ All icons generated successfully")
  } catch (error) {
    console.error("Error generating icons:", error)
    process.exit(1)
  }
}

generateBasicIcons().catch((error: Error) => {
  console.error("Unhandled error:", error)
  process.exit(1)
})

