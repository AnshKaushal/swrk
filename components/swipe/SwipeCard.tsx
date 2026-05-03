"use client"

import { useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Candidate = {
  _id: string
  name: string
  username?: string
  avatar?: string
  headline?: string
  bio?: string
  skills?: string[]
  isVerified?: boolean
  profileVerified?: boolean
  companyName?: string
  currentCity?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function SwipeCard({
  candidate,
  onAction,
}: {
  candidate: Candidate
  onAction: (direction: "left" | "right" | "super", id: string) => void
}) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const pointerStartX = useRef<number | null>(null)
  const pointerId = useRef<number | null>(null)

  const initials = candidate.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const rotation = clamp(dragX / 20, -12, 12)
  const swipeProgress = clamp(Math.abs(dragX) / 120, 0, 1)
  const showLike = dragX > 24
  const showPass = dragX < -24

  const cardStyle = useMemo(
    () => ({
      transform: `translate3d(${dragX}px, 0, 0) rotate(${rotation}deg)`,
      transition: dragging || isSettling ? "none" : "transform 220ms ease, box-shadow 220ms ease",
    }),
    [dragX, dragging, isSettling, rotation],
  )

  const resetCard = () => {
    setIsSettling(true)
    setDragX(0)
    window.setTimeout(() => setIsSettling(false), 220)
  }

  const triggerSwipe = (direction: "left" | "right" | "super") => {
    setIsSettling(true)
    const exitX = direction === "left" ? -window.innerWidth : window.innerWidth
    setDragX(exitX)
    window.setTimeout(() => {
      onAction(direction, candidate._id)
      setDragX(0)
      setIsSettling(false)
    }, 180)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isSettling) return
    pointerId.current = event.pointerId
    pointerStartX.current = event.clientX
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerStartX.current === null || pointerId.current !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - pointerStartX.current
    setDragX(deltaX)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return

    const deltaX = dragX
    pointerStartX.current = null
    pointerId.current = null
    setDragging(false)

    if (deltaX > 110) {
      triggerSwipe("right")
      return
    }

    if (deltaX < -110) {
      triggerSwipe("left")
      return
    }

    resetCard()
  }

  const handlePointerCancel = () => {
    pointerStartX.current = null
    pointerId.current = null
    setDragging(false)
    resetCard()
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl select-none">
      <div
        className="relative touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          touchAction: "pan-y",
          opacity: 1 - swipeProgress * 0.05,
        }}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 rounded-xl border-2 transition-opacity",
            showLike ? "border-emerald-500/70 opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 rounded-xl border-2 transition-opacity",
            showPass ? "border-rose-500/70 opacity-100" : "opacity-0",
          )}
        />

        <Card
          className="overflow-hidden border-border/60 bg-card/95 shadow-[0_24px_60px_-28px_hsl(var(--foreground)/0.35)] backdrop-blur-sm"
          style={cardStyle}
        >
          <CardHeader className="space-y-4 border-b border-border/60 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border border-border/70">
                  <AvatarImage src={candidate.avatar} alt={candidate.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{candidate.name}</CardTitle>
                  <CardDescription className="max-w-[28rem]">
                    {candidate.headline || candidate.companyName || "Profile ready for discovery"}
                  </CardDescription>
                </div>
              </div>

              {(candidate.isVerified || candidate.profileVerified) && (
                <Badge variant="secondary" className="shrink-0">
                  Verified
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {candidate.currentCity && (
                <Badge variant="outline">{candidate.currentCity}</Badge>
              )}
              {candidate.username && <Badge variant="outline">@{candidate.username}</Badge>}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {candidate.bio ? (
              <p className="text-sm leading-6 text-muted-foreground">{candidate.bio}</p>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No bio added yet. Use the swipe to discover more.
              </p>
            )}

            {candidate.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.slice(0, 8).map((skill) => (
                  <Badge key={skill} variant="outline" className="rounded-full px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="grid gap-2 border-t border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
            <Button variant="outline" className="w-full" onClick={() => triggerSwipe("left")}>
              Pass
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => triggerSwipe("super")}>
              Super
            </Button>
            <Button className="w-full" onClick={() => triggerSwipe("right")}>
              Like
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
