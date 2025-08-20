import type React from "react"
import type { Metadata } from "next"
import { Poppins, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
})

export const metadata: Metadata = {
  title: "FRANCA - Vendendo mais para Você",
  description: "Sistema interno para membros da Franca",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${montserrat.variable} antialiased`}>
      <head>
        <style>{`
html {
  font-family: ${poppins.style.fontFamily};
  --font-sans: var(--font-poppins);
  --font-serif: var(--font-montserrat);
}
        `}</style>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
