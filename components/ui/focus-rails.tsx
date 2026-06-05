"use client"

import * as React from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type FocusRailItem = {
  id: string | number
  title: string
  description?: string
  imageSrc: string
  href?: string
  meta?: string
}

interface FocusRailProps {
  items: FocusRailItem[]
  initialIndex?: number
  loop?: boolean
  autoPlay?: boolean
  interval?: number
  className?: string
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
}

function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

const BASE_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
} as const

const TAP_SPRING = {
  type: "spring",
  stiffness: 450,
  damping: 18,
  mass: 1,
} as const

export function FocusRail({
  items,
  initialIndex = 0,
  loop = true,
  autoPlay = false,
  interval = 4000,
  className,
  activeIndex,
  onActiveIndexChange,
}: FocusRailProps) {
  const [internalActive, setInternalActive] = React.useState(initialIndex)
  const [isHovering, setIsHovering] = React.useState(false)

  const count = items.length
  const active = typeof activeIndex === "number" ? activeIndex : internalActive

  if (count === 0) {
    return (
      <div
        className={cn(
          "group relative flex h-[600px] w-full flex-col overflow-hidden outline-none select-none overflow-x-hidden",
          className,
        )}
      />
    )
  }

  const wrappedActiveIndex = wrap(0, count, active)
  const activeItem = items[wrappedActiveIndex]

  const setActive = React.useCallback(
    (updater: React.SetStateAction<number>) => {
      const nextValue =
        typeof updater === "function"
          ? (updater as (value: number) => number)(active)
          : updater
      const wrapped = wrap(0, count, nextValue)

      if (typeof activeIndex !== "number") {
        setInternalActive(wrapped)
      }
      onActiveIndexChange?.(wrapped)
    },
    [active, activeIndex, count, onActiveIndexChange],
  )

  React.useEffect(() => {
    onActiveIndexChange?.(wrappedActiveIndex)
  }, [onActiveIndexChange, wrappedActiveIndex])

  React.useEffect(() => {
    if (!autoPlay || isHovering) return
    const timer = setInterval(() => setActive((p) => p + 1), interval)
    return () => clearInterval(timer)
  }, [autoPlay, isHovering, interval, setActive])

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const onDragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    { offset, velocity }: PanInfo,
  ) => {
    const swipe = swipePower(offset.x, velocity.x)

    if (swipe < -swipeConfidenceThreshold) {
      setActive((p) => p + 1)
    } else if (swipe > swipeConfidenceThreshold) {
      setActive((p) => p - 1)
    }
  }

  const visibleIndices = [-2, -1, 0, 1, 2]

  return (
    <div
      className={cn(
        "group relative flex h-[600px] w-full flex-col overflow-hidden outline-none select-none overflow-x-hidden",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`bg-${activeItem.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={activeItem.imageSrc}
              alt={activeItem.id.toString()}
              className="h-full w-full object-cover blur-3xl saturate-200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mx-auto flex h-[360px] w-full max-w-6xl items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          {visibleIndices.map((offset) => {
            const absIndex = active + offset
            const index = wrap(0, count, absIndex)
            const item = items[index]

            if (!loop && (absIndex < 0 || absIndex >= count)) return null

            const isCenter = offset === 0
            const dist = Math.abs(offset)

            const xOffset = offset * 320
            const zOffset = -dist * 180
            const scale = isCenter ? 1 : 0.85
            const rotateY = offset * -20

            const opacity = isCenter ? 1 : Math.max(0.1, 1 - dist * 0.5)
            const blur = isCenter ? 0 : dist * 6
            const brightness = isCenter ? 1 : 0.5

            return (
              <motion.div
                key={absIndex}
                className={cn(
                  "absolute aspect-[3/4] w-[260px] md:w-[300px] rounded-2xl border border-primary/20 bg-secondary dark:bg-background shadow-2xl transition-shadow duration-300",
                  isCenter ? "z-20 shadow-white/10" : "z-10",
                )}
                initial={false}
                animate={{
                  x: xOffset,
                  z: zOffset,
                  scale: scale,
                  rotateY: rotateY,
                  opacity: opacity,
                  filter: `blur(${blur}px) brightness(${brightness})`,
                }}
                transition={{
                  x: BASE_SPRING,
                  z: BASE_SPRING,
                  rotateY: BASE_SPRING,
                  opacity: BASE_SPRING,
                  filter: BASE_SPRING,
                  scale: TAP_SPRING,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                onClick={() => {
                  if (offset !== 0) setActive((p) => p + offset)
                }}
              >
                <img
                  src={item.imageSrc}
                  alt={item.title}
                  className="h-full w-full rounded-2xl object-cover pointer-events-none"
                />

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl bg-black/10 pointer-events-none mix-blend-multiply" />
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mx-auto mt-12 flex w-full max-w-4xl flex-col items-center justify-between gap-6 md:flex-row pointer-events-auto">
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left h-32 justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {activeItem.meta && (
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    {activeItem.meta}
                  </span>
                )}
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                  {activeItem.title}
                </h2>
                {activeItem.description && (
                  <p className="max-w-md text-neutral-400">
                    {activeItem.description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            {activeItem.href && (
              <Link
                href={activeItem.href}
                className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
              >
                Explore
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
