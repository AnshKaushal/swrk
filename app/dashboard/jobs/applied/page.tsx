"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Briefcase, FileText, Loader2, MapPin } from "lucide-react"
import Link from "next/link"

interface Position {
  _id: string
  title: string
  description: string
  roles: string[]
  locations: string[]
  skills: string[]
  createdAt: string
  slug?: string
  company?: string
  employmentType: string
  employerId?:
    | string
    | {
        _id?: string
        name?: string
        username?: string
        companyName?: string
        avatar?: string
      }
}

interface ApplicationSummary {
  _id: string
  source: "swipe" | "public"
  applicationStatus: string
  applicationSubmittedAt?: string | null
  applicationStatusUpdatedAt?: string | null
  applicationData?: Record<string, string>
  resumeUrl?: string
  resumeFileName?: string
  position: Position & {
    employerId?: Position["employerId"]
  }
}

function getApplicationStatusLabel(status: string) {
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

function getEmployerName(position: Position) {
  if (position.company) return position.company
  if (typeof position.employerId === "object" && position.employerId) {
    return (
      position.employerId.companyName ||
      position.employerId.name ||
      position.employerId.username ||
      "Recruiter"
    )
  }
  return "Recruiter"
}

export default function AppliedJobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
      return
    }
    if (session?.user?.id) {
      loadApplications(1)
    }
  }, [session, status, router])

  async function loadApplications(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/positions/applications?page=${p}&limit=10`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load applications")
      const data = await res.json()
      setApplications(data.applications || [])
      setPage(data.page || 1)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/jobs">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">My Applications</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every application and see where each employer stands.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No applications yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse available jobs and apply to see them here.
          </p>
          <Button className="mt-4 w-fit" asChild>
            <Link href="/dashboard/jobs">Browse Jobs</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application._id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {application.position.title}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {getEmployerName(application.position)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeof application.position.locations === "object" &&
                      application.position.locations?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {application.position.locations.join(", ")}
                        </span>
                      )}
                    <span className="text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(
                        application.applicationStatusUpdatedAt ||
                          application.applicationSubmittedAt ||
                          application.position.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                  <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">
                    {getApplicationStatusLabel(
                      application.applicationStatus,
                    )}
                  </Badge>
                  <div className="flex flex-wrap justify-end gap-2">
                    {application.resumeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(application.resumeUrl!, "_blank")
                        }
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/jobs/${application.position._id}`,
                        )
                      }
                    >
                      View Details
                    </Button>
                    {application.position.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/job/${application.position.slug}`)
                        }
                      >
                        View Job Page
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {totalPages > 1 && (
            <div className="pt-4">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={loadApplications}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
