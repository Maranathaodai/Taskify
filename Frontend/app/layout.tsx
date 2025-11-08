import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ClientProviders from "@/components/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {/* ClientProviders mounts Apollo and React Query; render app children inside it */}
          <ClientProviders>{children}</ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.app",
}
