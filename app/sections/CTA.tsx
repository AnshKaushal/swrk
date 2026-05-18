"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useRef } from "react"

interface VerticalMarqueeProps {
  children: ReactNode
  pauseOnHover?: boolean
  reverse?: boolean
  className?: string
  speed?: number
  onItemsRef?: (items: HTMLElement[]) => void
}

function VerticalMarquee({
  children,
  pauseOnHover = false,
  reverse = false,
  className,
  speed = 30,
  onItemsRef,
}: VerticalMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onItemsRef && containerRef.current) {
      const items = Array.from(
        containerRef.current.querySelectorAll(".marquee-item"),
      ) as HTMLElement[]
      onItemsRef(items)
    }
  }, [onItemsRef])

  return (
    <div
      ref={containerRef}
      className={cn("group flex flex-col overflow-hidden", className)}
      style={
        {
          "--duration": `${speed}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 flex-col animate-marquee-vertical",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 flex-col animate-marquee-vertical",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  )
}

const marqueeItems = [
  "Software Engineers",
  "Product Managers",
  "UX Designers",
  "Data Scientists",
  "DevOps Engineers",
  "Marketing Leaders",
  "Startup Founders",
  "HR Directors",
  "Project Managers",
  "Many More...",
]

export default function CTAWithVerticalMarquee() {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marqueeContainer = marqueeRef.current
    if (!marqueeContainer) return

    const updateOpacity = () => {
      const items = marqueeContainer.querySelectorAll(".marquee-item")
      const containerRect = marqueeContainer.getBoundingClientRect()
      const centerY = containerRect.top + containerRect.height / 2

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect()
        const itemCenterY = itemRect.top + itemRect.height / 2
        const distance = Math.abs(centerY - itemCenterY)
        const maxDistance = containerRect.height / 2
        const normalizedDistance = Math.min(distance / maxDistance, 1)
        const opacity = 1 - normalizedDistance * 0.75
        ;(item as HTMLElement).style.opacity = opacity.toString()
      })
    }

    const animationFrame = () => {
      updateOpacity()
      requestAnimationFrame(animationFrame)
    }

    const frame = requestAnimationFrame(animationFrame)

    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="bg-background text-foreground flex items-center justify-center py-12 md:py-16 overflow-hidden">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8  animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-24 items-center">
          <div className="space-y-6 max-w-xl">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4 animate-fade-in-up [animation-delay:200ms]">
              Find Your Perfect Match
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in-up [animation-delay:400ms]">
              Join thousands of professionals and companies using Mutch to
              discover meaningful career opportunities. Start your journey
              today.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up [animation-delay:600ms]">
              <Button size="lg" className="px-8 py-6 text-base font-semibold">
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="px-8 py-6 text-base font-semibold relative overflow-hidden group"
              >
                Learn More
              </Button>
            </div>
          </div>

          <div
            ref={marqueeRef}
            className="relative h-[600px] lg:h-[700px] flex items-center justify-center animate-fade-in-up [animation-delay:400ms]"
          >
            <div className="relative w-full h-full">
              <VerticalMarquee speed={20} className="h-full">
                {marqueeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight py-4 md:py-8 marquee-item"
                  >
                    {item}
                  </div>
                ))}
              </VerticalMarquee>

              <div className="pointer-events-none absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-background via-background/50 to-transparent z-10"></div>

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/50 to-transparent z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
