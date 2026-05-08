"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  MapPin,
  DollarSign,
  Briefcase,
  Users,
  Loader2,
  Heart,
  X,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

interface Position {
  _id: string
  title: string
  description: string
  roles: string[]
  locations: string[]
  industry: string
  skills: string[]
  experience: string
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  employmentType: string
  status: string
  matchCount: number
  createdAt: string
}

interface Candidate {
  _id: string
  name: string
  username?: string
  avatar?: string
  headline?: string
  bio?: string
  currentCity?: string
  currentCountry?: string
  preferredLocations?: string[]
  desiredRoles?: string[]
  employmentType?: string[]
  alreadySwiped?: boolean
}

export default function JobDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const positionId = params?.id as string

  const [position, setPosition] = useState<Position | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [swiping, setSwiping] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (positionId) {
      loadPosition()
      loadCandidates()
    }
  }, [positionId])

  async function loadPosition() {
    try {
      const res = await fetch(`/api/positions/${positionId}`)
      if (!res.ok) throw new Error("Failed to load position")
      const data = await res.json()
      setPosition(data.position)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load position")
    }
  }

  async function loadCandidates() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/positions/interested?positionId=${positionId}`,
      )
      if (!res.ok) throw new Error("Failed to load candidates")
      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }

  async function handleSwipe(candidateId: string, direction: "left" | "right") {
    setSwiping(true)
    try {
      const res = await fetch("/api/positions/employer-swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId,
          candidateId,
          direction,
        }),
      })

      if (!res.ok) throw new Error("Failed to swipe")

      const data = await res.json()

      if (data.matched) {
        toast.success("It's a match! You can now message this candidate.")
      } else if (direction === "right") {
        toast.success("Candidate saved")
      }

      // Remove from list
      setCandidates((prev) => prev.filter((c) => c._id !== candidateId))

      if (candidates.length <= 1) {
        await loadCandidates()
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to swipe")
    } finally {
      setSwiping(false)
    }
  }

  if (status === "loading" || !position) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{position.title}</h1>
            <p className="mt-2 text-muted-foreground">{position.description}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {position.locations?.length > 0 && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {position.locations.join(", ")}
                </div>
              )}

              {position.salaryRange?.min && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />$
                  {position.salaryRange.min.toLocaleString()} - $
                  {position.salaryRange.max?.toLocaleString() || "Open"}
                </div>
              )}

              {position.skills?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {position.skills.slice(0, 3).join(", ")}
                  {position.skills.length > 3 &&
                    `+${position.skills.length - 3}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5" />
          Interested Candidates ({candidates.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No candidates have shown interest yet
          </p>
        ) : (
          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <div
                key={candidate._id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <Link
                  href={`/${candidate.username}`}
                  className="flex flex-1 items-center gap-3"
                >
                  <Avatar>
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback>{candidate.name?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {candidate.headline || candidate.bio || "Job seeker"}
                    </p>
                    {candidate.currentCity && (
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {candidate.currentCity}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="ml-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSwipe(candidate._id, "left")}
                    disabled={swiping || candidate.alreadySwiped}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSwipe(candidate._id, "right")}
                    disabled={swiping || candidate.alreadySwiped}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
