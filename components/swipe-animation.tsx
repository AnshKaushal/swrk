"use client"

import { motion, useMotionValue, useTransform } from "motion/react"
import clsx from "clsx"

export interface DraggableGradientIconProps {
  direction: "left" | "right"
}

export const DraggableGradientIcon = ({
  direction,
}: DraggableGradientIconProps) => {
  const dragX = useMotionValue(0)

  const xStops = [-100, 0, 100]

  // Use CSS vars defined in globals.css for colors
  const likeGradient = `linear-gradient(180deg, rgb(var(--swipe-like-start)) 0%, rgb(var(--swipe-like-end)) 100%)`
  const passGradient = `linear-gradient(180deg, rgb(var(--swipe-pass-start)) 0%, rgb(var(--swipe-pass-end)) 100%)`

  const backgroundGradient = useTransform(dragX, xStops, [
    direction === "right" ? likeGradient : passGradient,
    direction === "right" ? likeGradient : passGradient,
    direction === "right" ? likeGradient : passGradient,
  ])

  const strokeColor = useTransform(dragX, xStops, [
    `rgb(var(--swipe-like-end))`,
    `rgb(var(--swipe-like-end))`,
    `rgb(var(--swipe-pass-end))`,
  ])

  const tickProgress = useTransform(dragX, [10, 100], [0, 1])
  const crossProgressA = useTransform(dragX, [-10, -55], [0, 1])
  const crossProgressB = useTransform(dragX, [-50, -100], [0, 1])

  return (
    <div className="flex justify-center items-center p-2">
      <motion.div
        className={clsx(
          "rounded-2xl p-3 shadow-lg ring-1 ring-border/40",
          "bg-card/80",
        )}
        style={{ ...containerStyles, background: backgroundGradient }}
      >
        <motion.div
          className="icon-wrapper"
          style={{ ...boxStyles, x: dragX }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
        >
          <svg
            viewBox="0 0 50 50"
            className="progress-svg"
            width={50}
            height={50}
          >
            {/* Circle */}
            <motion.path
              fill="none"
              strokeWidth={2}
              stroke={strokeColor as any}
              d="M 0,20 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0"
              style={{ x: 5, y: 5 }}
            />
            {/* Tick */}
            <motion.path
              fill="none"
              strokeWidth={2}
              stroke={strokeColor as any}
              d="M14,26 L22,33 L35,16"
              strokeDasharray="0 1"
              style={{ pathLength: tickProgress }}
            />
            {/* Cross A */}
            <motion.path
              fill="none"
              strokeWidth={2}
              stroke={strokeColor as any}
              d="M17,17 L33,33"
              strokeDasharray="0 1"
              style={{ pathLength: crossProgressA }}
            />
            <motion.path
              fill="none"
              strokeWidth={2}
              stroke={strokeColor as any}
              d="M33,17 L17,33"
              strokeDasharray="0 1"
              style={{ pathLength: crossProgressB }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ================= Styles ================= */

const boxStyles: React.CSSProperties = {
  width: 120,
  height: 120,
  backgroundColor: "var(--card)",
  borderRadius: 16,
  padding: 12,
}

const containerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flex: 1,
  width: 260,
  height: 180,
  maxWidth: "100%",
  borderRadius: 16,
}
