"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

type BrandLogoProps = {
  className?: string
  alt?: string
}

export function BrandLogo({ className, alt = "Mutch" }: BrandLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const desktopLogo =
    mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <img
        src="/logo-square.png"
        alt={alt}
        className="block h-full w-full object-contain md:hidden"
      />
      <img
        src={desktopLogo}
        alt={alt}
        className="hidden h-full w-full object-contain md:block"
      />
    </span>
  )
}
