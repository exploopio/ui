"use client"

import { ThemeProvider } from "@/context/theme-provider"
import { DirectionProvider } from "@/context/direction-provider"
import { Toaster } from "sonner"

export function Providers({
  children,
  dir,
}: {
  children: React.ReactNode
  dir: "ltr" | "rtl"
}) {
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