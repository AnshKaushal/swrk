"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { DraggableGradientIcon } from "@/components/swipe-animation"

type SwipeDirection = "left" | "right"

export interface SwipeableCardStackHandle {
  swipe: (direction: SwipeDirection) => Promise<boolean>
}

export interface SwipeableCardStackProps {
  images?: string[]
  borderRadius?: number
  showInnerShadows?: boolean
  greenShadowColor?: string
  redShadowColor?: string
  innerStrokeColor?: string
  shadowSize?: string
  shadowBlur?: string
  rightIcon?: string | null
  leftIcon?: string | null
  className?: string
  onSwipe?: (
    index: number,
    direction: SwipeDirection,
  ) => boolean | Promise<boolean | void>
}

export const SwipeableCardStack = React.forwardRef<
  SwipeableCardStackHandle,
  SwipeableCardStackProps
>(function SwipeableCardStack(
  {
    images = [],
    borderRadius = 16,
    showInnerShadows = true,
    greenShadowColor = "rgba(45, 150, 45, 0.75)",
    redShadowColor = "rgba(224, 83, 83, 0.75)",
    innerStrokeColor = "rgba(0, 0, 0, 0.1)",
    shadowSize = "0 8px 20px",
    shadowBlur = "rgba(0, 0, 0, 0.3)",
    rightIcon = null,
    leftIcon = null,
    className,
    onSwipe,
  }: SwipeableCardStackProps,
  ref,
) {
  const [cards, setCards] = React.useState<string[]>([])
  const [dragDirections, setDragDirections] = React.useState<
    Record<number, SwipeDirection | null>
  >({})
  const [isSwiping, setIsSwiping] = React.useState(false)
  const swipeThreshold = 80

  React.useEffect(() => {
    setCards([...images])
    setDragDirections({})
  }, [images])

  React.useEffect(() => {
    if (images.length > 0 && cards.length === 0) {
      const timer = window.setTimeout(() => {
        setCards([...images])
        setDragDirections({})
      }, 800)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [cards.length, images])

  const requestSwipe = React.useCallback(
    async (direction: SwipeDirection) => {
      if (isSwiping) return false

      const topIndex = cards.length - 1
      const topCard = cards[topIndex]
      if (!topCard) return false

      setIsSwiping(true)
      setDragDirections((previous) => ({
        ...previous,
        [topIndex]: direction,
      }))

      const shouldRemove = await Promise.resolve(onSwipe?.(topIndex, direction))
      if (shouldRemove === false) {
        setDragDirections((previous) => ({
          ...previous,
          [topIndex]: null,
        }))
        setIsSwiping(false)
        return false
      }

      window.setTimeout(() => {
        setDragDirections((previous) => {
          const next = { ...previous }
          delete next[topIndex]
          return next
        })
        setIsSwiping(false)
      }, 200)

      return true
    },
    [cards, isSwiping, onSwipe],
  )

  React.useImperativeHandle(ref, () => ({
    swipe: requestSwipe,
  }))

  const handleDrag = React.useCallback(
    (
      _event: PointerEvent | MouseEvent | TouchEvent,
      info: { offset: { x: number } },
      index: number,
    ) => {
      setDragDirections((previous) => ({
        ...previous,
        [index]:
          Math.abs(info.offset.x) > 20
            ? info.offset.x > 0
              ? "right"
              : "left"
            : null,
      }))
    },
    [],
  )

  const handleDragEnd = React.useCallback(
    async (
      _event: PointerEvent | MouseEvent | TouchEvent,
      info: { offset: { x: number }; velocity: { x: number } },
      index: number,
    ) => {
      const direction: SwipeDirection = info.offset.x > 0 ? "right" : "left"
      const distance = Math.abs(info.offset.x)
      const velocity = Math.abs(info.velocity.x)

      if (distance <= swipeThreshold && velocity < 500) {
        setDragDirections((previous) => ({
          ...previous,
          [index]: null,
        }))
        return
      }

      await requestSwipe(direction)
    },
    [requestSwipe],
  )

  return (
    <div className={cn("relative h-full w-full", className)}>
      <AnimatePresence>
        {cards.map((image, index) => {
          const isTopCard = index === cards.length - 1
          const isSecondCard = index === cards.length - 2
          const direction = dragDirections[index]
          const distanceFromTop = cards.length - 1 - index

          return (
            <motion.div
              key={`${image}-${index}`}
              drag={isTopCard && !isSwiping ? "x" : false}
              dragConstraints={{ left: -500, right: 500 }}
              dragElastic={0.2}
              dragTransition={{ power: 0.2, restDelta: 10 }}
              onDrag={(event, info) => handleDrag(event, info, index)}
              onDragEnd={(event, info) => {
                void handleDragEnd(event, info, index)
              }}
              initial={{
                x: 0,
                y: distanceFromTop * 16,
                scale: 1 - distanceFromTop * 0.05,
                opacity: distanceFromTop > 2 ? 0 : 1,
                zIndex: -distanceFromTop,
              }}
              animate={{
                x:
                  isTopCard && direction
                    ? direction === "right"
                      ? 500
                      : -500
                    : 0,
                y: isTopCard && direction ? 100 : distanceFromTop * 16,
                scale: 1 - distanceFromTop * 0.05,
                rotate:
                  isTopCard && direction
                    ? direction === "right"
                      ? 25
                      : -25
                    : 0,
                opacity: isTopCard && direction ? 0 : 1,
                zIndex: -distanceFromTop,
                transition:
                  isTopCard && direction
                    ? {
                        x: { duration: 0.2, ease: "easeOut" },
                        y: { duration: 0.2, ease: "easeOut" },
                        rotate: { duration: 0.2, ease: "easeOut" },
                        opacity: { duration: 0.15, ease: "easeOut" },
                      }
                    : {
                        y: { duration: 0.3, ease: "easeOut" },
                        scale: { duration: 0.3, ease: "easeOut" },
                      },
              }}
              exit={{
                x: direction === "right" ? 500 : -500,
                y: 100,
                rotate: direction === "right" ? 25 : -25,
                opacity: 0,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius,
                boxShadow: `inset 0 0 0 1px ${innerStrokeColor}, ${shadowSize} ${shadowBlur}`,
                cursor: isTopCard ? "grab" : "default",
                touchAction: "none",
              }}
            >
              {isTopCard && showInnerShadows ? (
                <>
                  <motion.div
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: direction ? 0.85 : 0,
                      transform: direction
                        ? direction === "right"
                          ? "translateX(0)"
                          : "translateX(0)"
                        : "none",
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius,
                      pointerEvents: "none",
                      background:
                        direction === "right"
                          ? `linear-gradient(180deg, rgba(0,0,0,0) 20%, ${greenShadowColor}22 55%, ${greenShadowColor}44)`
                          : direction === "left"
                            ? `linear-gradient(180deg, rgba(0,0,0,0) 20%, ${redShadowColor}22 55%, ${redShadowColor}44)`
                            : "transparent",
                      backdropFilter: direction ? "blur(6px)" : "none",
                    }}
                  />

                  {/* outer glow */}
                  {direction ? (
                    <motion.div
                      aria-hidden
                      initial={{ boxShadow: "0 0 0px rgba(0,0,0,0)" }}
                      animate={{
                        boxShadow:
                          direction === "right"
                            ? `0 24px 80px -28px ${greenShadowColor}`
                            : `0 24px 80px -28px ${redShadowColor}`,
                      }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius,
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}

                  {direction ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          direction === "right" ? "flex-end" : "flex-start",
                        padding: 24,
                      }}
                    >
                      <div className="pointer-events-none">
                        <DraggableGradientIcon direction={direction} />
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
})
