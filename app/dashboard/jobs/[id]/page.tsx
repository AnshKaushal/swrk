"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { MapPin, DollarSign, Briefcase, Users, Loader2 } from "lucide-react"
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
  applicationData?: Record<string, string>
  applicationSubmittedAt?: string | null
  applicationStatus?: string
  applicationStatusUpdatedAt?: string | null
}

function getApplicationStatusLabel(status?: string) {
  switch (status) {
    case "viewed":
      return "Viewed"
    case "shortlisted":
      return "Shortlisted"
    case "interview":
      return "Interview"
    case "rejected":
      return "Rejected"
    case "hired":
      return "Hired"
    case "withdrawn":
      return "Withdrawn"
    default:
      return "Submitted"
  }
}

export default function JobDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const positionId = params?.id as string

  const [position, setPosition] = useState<Position | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(
    null,
  )

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
      const res = await fetch(`/api/positions/${positionId}/applications`)
      if (!res.ok) throw new Error("Failed to load candidates")
      const data = await res.json()
      setCandidates(
        (data.applications || []).map((application: any) => ({
          ...application.candidate,
          applicationData: application.applicationData || {},
          applicationSubmittedAt: application.applicationSubmittedAt,
          applicationStatus: application.applicationStatus,
          applicationStatusUpdatedAt: application.applicationStatusUpdatedAt,
        })),
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }

  async function handleApplicationStatusChange(
    candidateId: string,
    status: "viewed" | "shortlisted" | "interview" | "rejected" | "hired",
  ) {
    setUpdatingCandidateId(candidateId)
    try {
      const res = await fetch(`/api/positions/${positionId}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, status }),
      })

      if (!res.ok) throw new Error("Failed to update application")

      const data = await res.json()

      toast.success(
        `Application marked as ${getApplicationStatusLabel(data.applicationStatus).toLowerCase()}`,
      )

      await loadCandidates()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update application")
    } finally {
      setUpdatingCandidateId(null)
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
                  <DollarSign className="h-4 w-4" />₹
                  {position.salaryRange.min.toLocaleString()} - ₹
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

                {candidate.applicationData &&
                Object.keys(candidate.applicationData).length > 0 ? (
                  <div className="mr-3 hidden max-w-[260px] rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground md:block">
                    <p className="mb-2 font-medium text-foreground">
                      Application answers
                    </p>
                    <div className="space-y-1">
                      {Object.entries(candidate.applicationData).map(
                        ([key, value]) => (
                          <p key={key} className="truncate">
                            <span className="font-medium text-foreground">
                              {key}:
                            </span>{" "}
                            {value || "-"}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="ml-3 flex flex-col items-end gap-2">
                  <Badge variant="secondary">
                    {getApplicationStatusLabel(candidate.applicationStatus)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleApplicationStatusChange(candidate._id, "viewed")
                      }
                      disabled={updatingCandidateId === candidate._id}
                    >
                      Viewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleApplicationStatusChange(
                          candidate._id,
                          "shortlisted",
                        )
                      }
                      disabled={updatingCandidateId === candidate._id}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleApplicationStatusChange(candidate._id, "rejected")
                      }
                      disabled={updatingCandidateId === candidate._id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
