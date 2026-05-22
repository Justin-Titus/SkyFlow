import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { RegisterPWA } from "@/components/pwa/RegisterPWA"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "SkyFlow | Premium Flight Booking",
  description: "Book your next premium flight with SkyFlow — real-time seats, instant confirmation.",
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050508" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#050508] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-100">
        <RegisterPWA />
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

