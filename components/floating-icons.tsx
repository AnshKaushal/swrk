"use client"
import * as React from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface IconProps {
  id: number
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  className: string
}

export interface FloatingIconsHeroProps {
  title: string
  subtitle: string
  ctaText: string
  ctaHref: string
  ctaText2: string
  ctaHref2: string
  icons: IconProps[]
}

const Icon = ({
  mouseX,
  mouseY,
  iconData,
  index,
}: {
  mouseX: React.RefObject<number>
  mouseY: React.RefObject<number>
  iconData: IconProps
  index: number
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const distance = Math.sqrt(
          Math.pow(mouseX.current - (rect.left + rect.width / 2), 2) +
            Math.pow(mouseY.current - (rect.top + rect.height / 2), 2),
        )

        if (distance < 150) {
          const angle = Math.atan2(
            mouseY.current - (rect.top + rect.height / 2),
            mouseX.current - (rect.left + rect.width / 2),
          )
          const force = (1 - distance / 150) * 50
          x.set(-Math.cos(angle) * force)
          y.set(-Math.sin(angle) * force)
        } else {
          x.set(0)
          y.set(0)
        }
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [x, y, mouseX, mouseY])

  return (
    <motion.div
      ref={ref}
      key={iconData.id}
      style={{
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("absolute", iconData.className)}
    >
      <motion.div
        className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 p-3 rounded-3xl shadow-xl bg-card/80 backdrop-blur-md border border-border/10"
        animate={{
          y: [0, -8, 0, 8, 0],
          x: [0, 6, 0, -6, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 5 + Math.random() * 5,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <iconData.icon className="w-8 h-8 md:w-10 md:h-10 text-foreground" />
      </motion.div>
    </motion.div>
  )
}

const FloatingIconsHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FloatingIconsHeroProps
>(
  (
    {
      className,
      title,
      subtitle,
      ctaText,
      ctaHref,
      ctaText2,
      ctaHref2,
      icons,
      ...props
    },
    ref,
  ) => {
    const mouseX = React.useRef(0)
    const mouseY = React.useRef(0)

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      mouseX.current = event.clientX
      mouseY.current = event.clientY
    }

    return (
      <section
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn(
          "relative w-full h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background",
          className,
        )}
        {...props}
      >
        <div className="absolute inset-0 w-full h-full md:opacity-100 opacity-40">
          {icons.map((iconData, index) => (
            <Icon
              key={iconData.id}
              mouseX={mouseX}
              mouseY={mouseY}
              iconData={iconData}
              index={index}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4! sm:px-6! lg:px-8!">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 text-transparent bg-clip-text">
            {title}
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground">
            {subtitle}
          </p>
          <div className="mt-10 flex md:flex-row flex-col gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="px-8 py-6 text-base font-semibold"
            >
              <a href={ctaHref}>{ctaText}</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base font-semibold"
            >
              <a href={ctaHref2}>{ctaText2}</a>
            </Button>
          </div>
          <div className="flex w-fit items-center rounded-full border border-border bg-background p-1 shadow shadow-black/5 mx-auto mt-6">
            <div className="flex -space-x-1.5">
              <img
                className="rounded-full ring-1 ring-background"
                src="https://dummyimage.com/200x200/0a0a0a/efefef?text=Av1"
                width={20}
                height={20}
                alt="Avatar 01"
              />
              <img
                className="rounded-full ring-1 ring-background"
                src="https://dummyimage.com/200x200/0a0a0a/efefef?text=Av1"
                width={20}
                height={20}
                alt="Avatar 02"
              />
              <img
                className="rounded-full ring-1 ring-background"
                src="https://dummyimage.com/200x200/0a0a0a/efefef?text=Av1"
                width={20}
                height={20}
                alt="Avatar 03"
              />
              <img
                className="rounded-full ring-1 ring-background"
                src="https://dummyimage.com/200x200/0a0a0a/efefef?text=Av1"
                width={20}
                height={20}
                alt="Avatar 04"
              />
            </div>
            <p className="px-2 text-xs text-muted-foreground">
              Trusted by{" "}
              <strong className="font-medium text-foreground">60K+</strong>{" "}
              employers and candidates.
            </p>
          </div>
        </div>
      </section>
    )
  },
)

FloatingIconsHero.displayName = "FloatingIconsHero"

export { FloatingIconsHero }
