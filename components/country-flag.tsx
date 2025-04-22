interface CountryFlagProps {
  countryCode: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function CountryFlag({ countryCode, className = "", size = "md" }: CountryFlagProps) {
  // Mapeo de tamaños a clases de altura y resoluciones
  const sizeClasses = {
    sm: "h-3.5 w-5",
    md: "h-5 w-7",
    lg: "h-6 w-9",
  }

  // Mapeo de tamaños a resoluciones
  const sizeResolutions = {
    sm: "40x30",
    md: "64x48",
    lg: "96x72",
  }

  // Asegurarse de que el código de país esté en minúsculas para la URL
  const code = countryCode.toLowerCase()

  return (
    <img
      src={`https://flagcdn.com/${sizeResolutions[size]}/${code}.png`}
      alt={`Bandera de ${countryCode}`}
      className={`object-contain ${sizeClasses[size]} ${className}`}
    />
  )
}
