import sharp from "sharp"

// Crear un ícono específico para el panel lateral
sharp("public/icons/icon-96x96.png")
  .resize(96, 96)
  .toFile("public/icons/side-panel-icon.png")
  .then((info) => {
    console.log("Side panel icon generated:", info)
  })
  .catch((err) => {
    console.error("Error generating side panel icon:", err)
  })

