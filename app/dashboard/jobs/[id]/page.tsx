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
  FileText,
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
  resumeUrl?: string
  resumeFileName?: string
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
  resumeUrl?: string
  resumeFileName?: string
}

function getApplicationStatusLabel(status?: string) {
  switch (status) {
    case "new":
      return "New"
    case "screened":
      return "Screened"
    case "shortlisted":
      return "Shortlisted"
    case "maybe":
      return "Maybe"
    case "interview":
      return "Interview"
    case "offer":
      return "Offer"
    case "hired":
      return "Hired"
    case "rejected":
      return "Rejected"
    case "withdrawn":
      return "Withdrawn"
    default:
      return "New"
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
  const [applicantTab, setApplicantTab] = useState<"registered" | "direct">(
    "registered",
  )
  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null)
  const [selectedPublicApplicant, setSelectedPublicApplicant] =
    useState<PublicApplicant | null>(null)

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
      const mapped = (data.applications || []).map((application: any) => ({
        ...application.candidate,
        applicationData: application.applicationData || {},
        applicationSubmittedAt: application.applicationSubmittedAt,
        applicationStatus: application.applicationStatus,
        applicationStatusUpdatedAt: application.applicationStatusUpdatedAt,
        resumeUrl: application.resumeUrl || "",
        resumeFileName: application.resumeFileName || "",
      }))
      setCandidates(mapped)
      if (mapped.length > 0 && !selectedCandidate) {
        setSelectedCandidate(mapped[0])
        setSelectedPublicApplicant(null)
      }
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
      const mapped = data.applications || []
      setPublicApplicants(mapped)
      if (mapped.length > 0 && !selectedPublicApplicant) {
        setSelectedPublicApplicant(mapped[0])
        setSelectedCandidate(null)
      } else if (mapped.length === 0) {
        setSelectedPublicApplicant(null)
      }
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
    status: string,
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

  async function handlePublicStatusChange(
    publicApplicationId: string,
    status: string,
  ) {
    setUpdatingCandidateId(publicApplicationId)
    try {
      const res = await fetch(`/api/positions/${positionId}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicApplicationId, status }),
      })

      if (!res.ok) throw new Error("Failed to update application")

      const data = await res.json()

      toast.success(
        `Application marked as ${getApplicationStatusLabel(data.applicationStatus).toLowerCase()}`,
      )

      await loadPublicApplicants()
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
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <Button
              variant={applicantTab === "registered" ? "default" : "ghost"}
              size="sm"
              onClick={() => setApplicantTab("registered")}
            >
              <Users className="mr-1.5 h-4 w-4" />
              Registered ({candidateTotal})
            </Button>
            <Button
              variant={applicantTab === "direct" ? "default" : "ghost"}
              size="sm"
              onClick={() => setApplicantTab("direct")}
            >
              <Globe className="mr-1.5 h-4 w-4" />
              Direct ({publicTotal})
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-border">
              {applicantTab === "registered" ? (
                loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No registered applicants yet
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {candidates.map((candidate) => (
                      <button
                        key={candidate._id}
                        onClick={() => {
                          setSelectedCandidate(candidate)
                          setSelectedPublicApplicant(null)
                        }}
                        className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                          selectedCandidate?._id === candidate._id
                            ? "bg-muted"
                            : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={candidate.avatar} />
                          <AvatarFallback>
                            {candidate.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {candidate.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {candidate.headline || "Job seeker"}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px]"
                          >
                            {getApplicationStatusLabel(
                              candidate.applicationStatus,
                            )}
                          </Badge>
                        </div>
                      </button>
                    ))}
                    {candidateTotalPages > 1 && (
                      <div className="p-3">
                        <PaginationControls
                          page={candidatePage}
                          totalPages={candidateTotalPages}
                          onPageChange={(p) => loadCandidates(p)}
                        />
                      </div>
                    )}
                  </div>
                )
              ) : publicLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : publicApplicants.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No direct applicants yet
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {publicApplicants.map((applicant) => (
                    <button
                      key={applicant._id}
                      onClick={() => {
                        setSelectedPublicApplicant(applicant)
                        setSelectedCandidate(null)
                      }}
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                        selectedPublicApplicant?._id === applicant._id
                          ? "bg-muted"
                          : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>
                          {applicant.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {applicant.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {applicant.email}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[10px]"
                        >
                          {getApplicationStatusLabel(
                            applicant.status,
                          )}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {publicTotalPages > 1 && (
                    <div className="p-3">
                      <PaginationControls
                        page={publicPage}
                        totalPages={publicTotalPages}
                        onPageChange={(p) => loadPublicApplicants(p)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border">
              {selectedCandidate ? (
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/${selectedCandidate.username}`}
                      className="shrink-0"
                    >
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedCandidate.avatar} />
                        <AvatarFallback className="text-lg">
                          {selectedCandidate.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${selectedCandidate.username}`}
                        className="hover:underline"
                      >
                        <h3 className="text-xl font-bold">
                          {selectedCandidate.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {selectedCandidate.headline || "Job seeker"}
                      </p>
                      {(selectedCandidate.currentCity ||
                        selectedCandidate.currentCountry) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[
                            selectedCandidate.currentCity,
                            selectedCandidate.currentCountry,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge>
                          {getApplicationStatusLabel(
                            selectedCandidate.applicationStatus,
                          )}
                        </Badge>
                        {selectedCandidate.applicationSubmittedAt && (
                          <span className="text-xs text-muted-foreground">
                            Applied{" "}
                            {new Date(
                              selectedCandidate.applicationSubmittedAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedCandidate.desiredRoles?.length! > 0 && (
                    <div className="mt-4">
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Desired Roles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.desiredRoles!.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCandidate.preferredLocations?.length! > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                        Preferred Locations
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCandidate.preferredLocations!.join(", ")}
                      </p>
                    </div>
                  )}

                  {selectedCandidate.applicationData &&
                    Object.keys(selectedCandidate.applicationData).length >
                      0 && (
                      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                          Application answers
                        </p>
                        <div className="space-y-3">
                          {Object.entries(
                            selectedCandidate.applicationData,
                          ).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs font-medium text-foreground">
                                {key}
                              </p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {String(value || "-")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedCandidate.resumeUrl && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            selectedCandidate.resumeUrl!,
                            "_blank",
                          )
                        }
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {selectedCandidate.resumeFileName ||
                          "View Resume"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Move to stage
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "screened" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "screened",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Screened
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "shortlisted" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "shortlisted",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "maybe" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "maybe",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Maybe
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "interview" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "interview",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Interview
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "offer" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "offer",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Offer
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedCandidate.applicationStatus === "hired" ? "default" : "outline"}
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "hired",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Hire
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleApplicationStatusChange(
                            selectedCandidate._id,
                            "rejected",
                          )
                        }
                        disabled={updatingCandidateId === selectedCandidate._id}
                      >
                        {updatingCandidateId === selectedCandidate._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selectedPublicApplicant ? (
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {selectedPublicApplicant.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold">
                        {selectedPublicApplicant.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <a
                          href={`mailto:${selectedPublicApplicant.email}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                          {selectedPublicApplicant.email}
                        </a>
                        {selectedPublicApplicant.phone && (
                          <a
                            href={`tel:${selectedPublicApplicant.phone}`}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            {selectedPublicApplicant.phone}
                          </a>
                        )}
                      </div>
                      {selectedPublicApplicant.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {selectedPublicApplicant.location}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge>
                          {getApplicationStatusLabel(
                            selectedPublicApplicant.status,
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Applied{" "}
                          {new Date(
                            selectedPublicApplicant.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedPublicApplicant.linkedin && (
                    <a
                      href={selectedPublicApplicant.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn Profile
                    </a>
                  )}

                  {selectedPublicApplicant.workExperience && (
                    <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Work Experience
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {selectedPublicApplicant.workExperience}
                      </p>
                    </div>
                  )}

                  {selectedPublicApplicant.resumeUrl && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            selectedPublicApplicant.resumeUrl!,
                            "_blank",
                          )
                        }
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {selectedPublicApplicant.resumeFileName ||
                          "View Resume"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Move to stage
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "screened" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "screened",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Screened
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "shortlisted" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "shortlisted",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "maybe" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "maybe",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Maybe
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "interview" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "interview",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Interview
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "offer" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "offer",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Offer
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedPublicApplicant.status === "hired" ? "default" : "outline"}
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "hired",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Hire
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handlePublicStatusChange(
                            selectedPublicApplicant._id,
                            "rejected",
                          )
                        }
                        disabled={updatingCandidateId === selectedPublicApplicant._id}
                      >
                        {updatingCandidateId === selectedPublicApplicant._id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = `mailto:${selectedPublicApplicant.email}`
                      }}
                    >
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Button>
                    {selectedPublicApplicant.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.location.href = `tel:${selectedPublicApplicant.phone}`
                        }}
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-24">
                  <p className="text-sm text-muted-foreground">
                    Select an applicant to view their details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
