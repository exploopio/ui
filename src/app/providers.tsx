"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/context/theme-provider"
import { DirectionProvider } from "@/context/direction-provider"
import { Toaster } from "sonner"
import { initWebVitals } from "@/lib/web-vitals"

export function Providers({
  children,
  dir,
}: {
  children: React.ReactNode
  dir: "ltr" | "rtl"
}) {
  // Initialize Web Vitals reporting
  useEffect(() => {
    initWebVitals()
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <DirectionProvider dir={dir}>
        {children}
        <Toaster richColors />
      </DirectionProvider>
    </ThemeProvider>
  )
}