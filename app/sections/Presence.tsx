"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { Backlight } from "@/components/ui/backlight"

function CommandCenter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="h-6 sm:h-8 bg-muted/40 border-b border-border flex items-center px-3 sm:px-4 gap-1.5 sm:gap-2">
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex-1">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=60"
          alt="Command Center Preview"
          className="w-full h-auto rounded-lg sm:rounded-2xl object-cover"
        />
      </div>
    </div>
  )
}

function CuratedReview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-xl sm:rounded-2xl border-4 border-border shadow-xl overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="flex-1">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=60"
          alt="Curated Review Preview"
          className="w-full h-full rounded-lg sm:rounded-2xl object-cover"
        />
      </div>
    </div>
  )
}

function ExecutiveBriefing({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-xl sm:rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="h-5 sm:h-6 bg-muted/40 border-b border-border flex items-center px-3 gap-1.5">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/30" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex-1">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=60"
          alt="Executive Briefing Preview"
          className="w-full h-auto rounded-lg sm:rounded-2xl object-cover"
        />
      </div>
    </div>
  )
}

function MobileOnTheGo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-[2rem] sm:rounded-[2.5rem] border-[6px] sm:border-8 border-muted shadow-2xl overflow-hidden flex flex-col",
        className,
      )}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-4 sm:h-5 bg-muted rounded-b-xl z-10" />
      <div className="h-full">
        <img
          src="https://plus.unsplash.com/premium_photo-1718732861190-c3edf2912061?w=900&auto=format&fit=crop&q=60"
          alt="Mobile Preview"
          className="w-full h-full rounded-xl sm:rounded-2xl object-cover"
        />
      </div>
    </div>
  )
}

export default function Presence() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const yBack = useTransform(scrollYProgress, [0, 1], ["-10%", "-10%"])
  const yMid = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"])
  const yFrontRight = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"])
  const yFrontLeft = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"])

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Omnipresent Intelligence
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience a frictionless transition across all dimensions. Your
              talent pipeline, perfectly synchronized across mobile, tablet, and
              desktop environments.
            </p>
          </motion.div>
        </div>

        <Backlight blur={5}>
          <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] lg:aspect-[21/9] max-w-7xl mx-auto flex items-center justify-center isolate pointer-events-none">
            {/* Back Layer: Desktop Command Center */}
            <motion.div
              style={{ y: yBack }}
              className="absolute w-[85%] sm:w-[75%] lg:w-[65%] top-[5%] lg:top-0 right-0 sm:right-[5%] lg:right-[10%] z-0"
            >
              <CommandCenter className="w-full aspect-[16/10]" />
            </motion.div>

            {/* Middle Layer: Tablet Curated Review */}
            <motion.div
              style={{ y: yMid }}
              className="absolute w-[55%] sm:w-[40%] lg:w-[28%] left-[-5%] sm:left-[2%] lg:left-[5%] top-[15%] sm:top-[20%] lg:top-[12%] z-10"
            >
              <CuratedReview className="w-full aspect-[3/4]" />
            </motion.div>

            {/* Front Layer Right: Dashboard Executive Briefing */}
            <motion.div
              style={{ y: yFrontRight }}
              className="absolute w-[65%] sm:w-[50%] lg:w-[40%] right-[-5%] sm:right-[2%] lg:right-[5%] bottom-[15%] sm:bottom-[10%] lg:bottom-[-5%] z-20"
            >
              <ExecutiveBriefing className="w-full aspect-[16/10]" />
            </motion.div>

            {/* Front Layer Left: Mobile On-The-Go */}
            <motion.div
              style={{ y: yFrontLeft }}
              className="absolute w-[35%] sm:w-[25%] lg:w-[18%] left-[10%] sm:left-[15%] lg:left-[18%] bottom-[5%] sm:bottom-[0%] lg:bottom-[-15%] z-30"
            >
              <MobileOnTheGo className="w-full aspect-[9/19]" />
            </motion.div>
          </div>
        </Backlight>
      </div>
    </section>
  )
}
