"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import SwipeCard from "@/components/swipe/SwipeCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

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
}

type SwipeResponse = {
  candidates?: Candidate[]
  rankingMode?: "ai" | "heuristic"
  swipeCount?: number
  aiThreshold?: number
}

export default function SwipeDeck() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rankingMode, setRankingMode] = useState<"ai" | "heuristic">(
    "heuristic",
  )
  const [swipeCount, setSwipeCount] = useState(0)
  const [aiThreshold, setAiThreshold] = useState(25)
  const lock = useRef(false)

  useEffect(() => {
    void loadCandidates()
  }, [])

  async function loadCandidates(excludeIds: string[] = []) {
    setLoading(true)

    try {
      const params = new URLSearchParams({ limit: "30" })
      excludeIds.forEach((id) => params.append("excludeId", id))

      const res = await fetch(`/api/swipe/candidates?${params.toString()}`, {
        cache: "no-store",
      })
      const json = (await res.json()) as SwipeResponse

      setCandidates(json.candidates || [])
      setIndex(0)
      setRankingMode(json.rankingMode || "heuristic")
      setSwipeCount(json.swipeCount || 0)
      setAiThreshold(json.aiThreshold || 25)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }

  async function doAction(direction: "left" | "right" | "super", id: string) {
    if (lock.current) return
    lock.current = true

    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: id, direction }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          toast.error(
            "That profile is no longer available. Reloading candidates.",
          )
          await loadCandidates([id])
          return
        }

        toast.error(json?.error || "Failed to perform action")
        return
      }

      if (json.matched) {
        toast.success("It's a match!")
      }

      setIndex((currentIndex) => currentIndex + 1)

      if (candidates.length - (index + 1) <= 6) {
        await loadCandidates()
      }
    } catch (error) {
      console.error(error)
      toast.error("Action failed")
    } finally {
      lock.current = false
    }
  }

  const currentCandidate = candidates[index] as Candidate | undefined
  const currentCandidateId = currentCandidate?._id

  const modeLabel = useMemo(
    () => (rankingMode === "ai" ? "AI ranked" : "New user mode"),
    [rankingMode],
  )

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="space-y-2 border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Discover</CardTitle>
              <CardDescription>
                {swipeCount < aiThreshold
                  ? `You are in starter mode. AI turns on after ${aiThreshold} swipes.`
                  : "Candidates are ranked with Groq based on your swipe history."}
              </CardDescription>
            </div>
            <Badge variant="secondary">{modeLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {loading && (
            <div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
              Loading candidates...
            </div>
          )}

          {!loading && !currentCandidate && (
            <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center">
              <p className="text-base font-medium">
                No more candidates right now.
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                We’ll refresh the queue after new profiles are available.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  void loadCandidates(
                    currentCandidateId ? [currentCandidateId] : [],
                  )
                }
              >
                Refresh queue
              </Button>
            </div>
          )}

          {currentCandidate && (
            <div className="space-y-4">
              <SwipeCard candidate={currentCandidate} onAction={doAction} />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {index + 1} of {candidates.length}
                </span>
                <span>
                  {swipeCount < aiThreshold
                    ? "Heuristic ranking is active for new users."
                    : "AI ranking is active for discovery."}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
