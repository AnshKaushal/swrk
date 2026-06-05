"use client"

import { useEffect, useState } from "react"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  MapPin,
  DollarSign,
  Briefcase,
  Users,
  Loader2,
  Copy,
  Mail,
  Phone,
  Globe,
  ExternalLink,
} from "lucide-react"
import { Markdown } from "@/components/ui/markdown"
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
  slug?: string
  externalLink?: string
  isExternal?: boolean
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

interface PublicApplicant {
  _id: string
  name: string
  email: string
  phone: string
  linkedin: string
  location: string
  workExperience: string
  status: string
  createdAt: string
  candidateId?: string | null
  isExternal?: boolean
  externalLink?: string
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
  const [publicApplicants, setPublicApplicants] = useState<PublicApplicant[]>(
    [],
  )
  const [loading, setLoading] = useState(false)
  const [publicLoading, setPublicLoading] = useState(false)
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(
    null,
  )
  const [candidatePage, setCandidatePage] = useState(1)
  const [candidateTotalPages, setCandidateTotalPages] = useState(1)
  const [candidateTotal, setCandidateTotal] = useState(0)
  const [publicPage, setPublicPage] = useState(1)
  const [publicTotalPages, setPublicTotalPages] = useState(1)
  const [publicTotal, setPublicTotal] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (positionId) {
      loadPosition()
    }
  }, [positionId])

  useEffect(() => {
    if (positionId && (session?.user?.role === "employer" || session?.user?.role === "admin")) {
      loadCandidates()
      loadPublicApplicants()
    }
  }, [positionId, session?.user?.role])

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

  async function loadCandidates(page = 1) {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/positions/${positionId}/applications?page=${page}&limit=10`,
      )
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
      setCandidatePage(data.page || 1)
      setCandidateTotalPages(data.totalPages || 1)
      setCandidateTotal(data.total || 0)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }

  async function loadPublicApplicants(page = 1) {
    setPublicLoading(true)
    try {
      const res = await fetch(
        `/api/positions/${positionId}/public-applications?page=${page}&limit=10`,
      )
      if (!res.ok) throw new Error("Failed to load public applicants")
      const data = await res.json()
      setPublicApplicants(data.applications || [])
      setPublicPage(data.page || 1)
      setPublicTotalPages(data.totalPages || 1)
      setPublicTotal(data.total || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setPublicLoading(false)
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

  const isEmployer = session?.user?.role === "employer" || session?.user?.role === "admin"

  function formatApplicantCount(count: number) {
    return count > 100 ? "100+" : String(count)
  }

  const allApplicantsCount =
    candidates.length + publicApplicants.filter((a) => !a.candidateId).length

  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-4 px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-2 w-fit"
      >
        ← Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-3xl font-bold">{position.title}</h1>
          <div className="mt-4">
            <Markdown>{position.description}</Markdown>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Job Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    position.status === "active" ? "default" : "secondary"
                  }
                >
                  {position.status}
                </Badge>
              </div>
              {position.locations?.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-right">
                    {position.locations.join(", ")}
                  </span>
                </div>
              )}
              {position.roles?.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-right">
                    {position.roles.join(", ")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {position.employmentType}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium capitalize">
                  {position.experience}
                </span>
              </div>
              {position.industry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium text-right">
                    {position.industry}
                  </span>
                </div>
              )}
              {position.salaryRange?.min && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-medium">
                    ₹{position.salaryRange.min.toLocaleString()}
                    {position.salaryRange.max
                      ? ` - ₹${position.salaryRange.max.toLocaleString()}`
                      : ""}
                  </span>
                </div>
              )}
              {position.matchCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Applicants</span>
                  <span className="font-medium">{formatApplicantCount(position.matchCount)}</span>
                </div>
              )}
            </div>

            {position.skills?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {position.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {isEmployer && position.slug && (
            <Card className="p-5">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                Shareable Link
              </h2>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-xs">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/job/${position.slug}`
                    : ""}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="py-4!"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/job/${position.slug}`,
                    )
                    toast.success("Link copied!")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {isEmployer && (
        <Card className="p-4">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5" />
          Registered Applicants ({candidateTotal})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No registered candidates have applied yet
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

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{candidate.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
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
        {candidateTotalPages > 1 && (
          <div className="mt-4">
            <PaginationControls
              page={candidatePage}
              totalPages={candidateTotalPages}
              onPageChange={(p) => loadCandidates(p)}
            />
          </div>
        )}
      </Card>
      )}

      {isEmployer && (
        <Card className="p-4">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Globe className="h-5 w-5" />
          Direct Applicants ({publicTotal})
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          People who applied via the public shareable link without an account.
          Contact them directly via email or phone.
        </p>

        {publicLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : publicApplicants.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No direct applications yet
          </p>
        ) : (
          <div className="grid gap-3">
            {publicApplicants.map((applicant) => (
              <div key={applicant._id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{applicant.name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <a
                        href={`mailto:${applicant.email}`}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Mail className="h-3 w-3" />
                        {applicant.email}
                      </a>
                      {applicant.phone && (
                        <a
                          href={`tel:${applicant.phone}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {applicant.phone}
                        </a>
                      )}
                    </div>
                    {applicant.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {applicant.location}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {new Date(applicant.createdAt).toLocaleDateString()}
                  </Badge>
                </div>

                {applicant.workExperience && (
                  <div className="mt-3 rounded-lg bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Work Experience
                    </p>
                    <p className="mt-1 text-sm">{applicant.workExperience}</p>
                  </div>
                )}

                {applicant.linkedin && (
                  <a
                    href={applicant.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    LinkedIn Profile
                  </a>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `mailto:${applicant.email}`
                    }}
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </Button>
                  {applicant.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = `tel:${applicant.phone}`
                      }}
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {publicTotalPages > 1 && (
          <div className="mt-4">
            <PaginationControls
              page={publicPage}
              totalPages={publicTotalPages}
              onPageChange={(p) => loadPublicApplicants(p)}
            />
          </div>
        )}
      </Card>
      )}
    </div>
  )
}
