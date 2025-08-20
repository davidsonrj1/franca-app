interface FrancaLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export default function FrancaLogo({ size = "md", showText = true, className = "" }: FrancaLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Main geometric shape - ascending diagonal */}
          <path d="M20 80 L50 20 L80 50 L50 50 L50 80 Z" fill="#7DE08D" className="drop-shadow-sm" />
          {/* Secondary shape for depth */}
          <path d="M50 20 L80 50 L80 20 Z" fill="#598F74" />
          {/* F letter */}
          <text x="35" y="65" fontSize="32" fontWeight="bold" fill="#081534" fontFamily="Poppins, sans-serif">
            F
          </text>
          {/* Dot element */}
          <circle cx="75" cy="75" r="4" fill="#081534" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-sans font-bold text-foreground ${textSizeClasses[size]}`}>FRANCA</span>
          {size !== "sm" && <span className="text-xs font-serif text-muted-foreground">Vendendo mais para Você</span>}
        </div>
      )}
    </div>
  )
}
