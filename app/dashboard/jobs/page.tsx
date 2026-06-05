"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Heart,
  X,
  Copy,
  Search,
  ExternalLink,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ActiveRole = "employee" | "employer"

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
  isVisible: boolean
  matchCount: number
  createdAt: string
  slug?: string
  company?: string
  externalLink?: string
  isExternal?: boolean
  applicationForm?: ApplicationFormConfig
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
  applicationStatus: string
  applicationSubmittedAt?: string | null
  applicationStatusUpdatedAt?: string | null
  applicationData?: Record<string, string>
  position: Position & {
    employerId?: Position["employerId"]
  }
}

type ApplicationFieldType =
  | "short-text"
  | "long-text"
  | "email"
  | "number"
  | "select"
  | "url"
  | "phone"
  | "date"

type ApplicationAutofillSource =
  | "none"
  | "name"
  | "email"
  | "phone"
  | "headline"
  | "bio"
  | "location"
  | "skills"
  | "experienceYears"
  | "resumeUrl"
  | "linkedin"
  | "github"
  | "portfolio"

interface ApplicationFormField {
  id: string
  label: string
  type: ApplicationFieldType
  required: boolean
  placeholder: string
  options: string[]
  autofillSource: ApplicationAutofillSource
}

interface ApplicationFormConfig {
  title: string
  description: string
  fields: ApplicationFormField[]
}

interface CandidateProfileResponse {
  user?: {
    name?: string
    email?: string
    phone?: string
    avatar?: string
    linkedinUrl?: string
    githubUrl?: string
    portfolioUrl?: string
    address?: {
      city?: string
      state?: string
      country?: string
    }
  }
  employeeProfile?: {
    headline?: string
    bio?: string
    currentCity?: string
    currentState?: string
    currentCountry?: string
    primarySkills?: string[]
    secondarySkills?: string[]
    totalExperienceYears?: number
    cvUrl?: string
  }
  resumes?: Array<{
    url?: string
    isFeatured?: boolean
  }>
}

function createFieldId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )
}

function createApplicationField(): ApplicationFormField {
  return {
    id: createFieldId(),
    label: "",
    type: "short-text",
    required: false,
    placeholder: "",
    options: [],
    autofillSource: "none",
  }
}

function inferFieldFromLabel(label: string) {
  const value = (label || "").toLowerCase()
  if (!value.trim()) return null

  if (value.includes("email")) return { type: "email", autofill: "email" }
  if (value.includes("phone") || value.includes("mobile"))
    return { type: "phone", autofill: "phone" }
  if (value.includes("linkedin")) return { type: "url", autofill: "linkedin" }
  if (value.includes("github")) return { type: "url", autofill: "github" }
  if (
    value.includes("portfolio") ||
    value.includes("website") ||
    value.includes("site")
  )
    return { type: "url", autofill: "portfolio" }
  if (value.includes("resume") || value.includes("cv"))
    return { type: "url", autofill: "resumeUrl" }
  if (
    value.includes("date") ||
    value.includes("start date") ||
    value.includes("joined")
  )
    return { type: "date", autofill: "none" }
  if (
    value.includes("years") ||
    value.includes("experience") ||
    value.includes("exp")
  )
    return { type: "number", autofill: "experienceYears" }
  if (value.includes("skills"))
    return { type: "short-text", autofill: "skills" }
  if (value.includes("name")) return { type: "short-text", autofill: "name" }
  if (value.includes("url")) return { type: "url", autofill: "none" }
  if (
    value.includes("yes/no") ||
    value.startsWith("are you") ||
    value.startsWith("do you") ||
    value.includes("available")
  )
    return { type: "select", autofill: "none", options: ["Yes", "No"] }

  return null
}

function createApplicationForm(): ApplicationFormConfig {
  return {
    title: "Application form",
    description: "Tell us a bit more about yourself.",
    fields: [],
  }
}

function normalizeApplicationForm(
  value?: ApplicationFormConfig | null,
): ApplicationFormConfig {
  if (!value) return createApplicationForm()

  return {
    title: value.title || "Application form",
    description: value.description || "Tell us a bit more about yourself.",
    fields: (value.fields || []).map((field) => ({
      id: field.id || createFieldId(),
      label: field.label || "",
      type: field.type || "short-text",
      required: Boolean(field.required),
      placeholder: field.placeholder || "",
      options: Array.isArray(field.options) ? field.options : [],
      autofillSource: field.autofillSource || "none",
    })),
  }
}

function getAutofillValue(
  source: ApplicationAutofillSource,
  profile: CandidateProfileResponse | null,
) {
  if (!profile || source === "none") return ""

  const user = profile.user || {}
  const employeeProfile = profile.employeeProfile || {}

  switch (source) {
    case "name":
      return user.name || ""
    case "email":
      return user.email || ""
    case "phone":
      return user.phone || ""
    case "headline":
      return employeeProfile.headline || ""
    case "bio":
      return employeeProfile.bio || ""
    case "location":
      return [
        employeeProfile.currentCity,
        employeeProfile.currentState,
        employeeProfile.currentCountry,
      ]
        .filter(Boolean)
        .join(", ")
    case "skills":
      return [
        ...(employeeProfile.primarySkills || []),
        ...(employeeProfile.secondarySkills || []),
      ]
        .filter(Boolean)
        .join(", ")
    case "experienceYears":
      return employeeProfile.totalExperienceYears !== undefined
        ? String(employeeProfile.totalExperienceYears)
        : ""
    case "resumeUrl":
      return (
        employeeProfile.cvUrl ||
        profile.resumes?.find((resume) => resume.isFeatured)?.url ||
        profile.resumes?.[0]?.url ||
        ""
      )
    case "linkedin":
      return user.linkedinUrl || ""
    case "github":
      return user.githubUrl || ""
    case "portfolio":
      return user.portfolioUrl || ""
    default:
      return ""
  }
}

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(true)
  const [canAccessJobs, setCanAccessJobs] = useState(false)
  const [activeRole, setActiveRole] = useState<ActiveRole>("employee")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyingPositionId, setApplyingPositionId] = useState<string | null>(
    null,
  )
  const [applicationFormDraft, setApplicationFormDraft] =
    useState<ApplicationFormConfig>(createApplicationForm())
  const [candidateProfile, setCandidateProfile] =
    useState<CandidateProfileResponse | null>(null)
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false)
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false)
  const [applicationTarget, setApplicationTarget] = useState<Position | null>(
    null,
  )
  const [applicationValues, setApplicationValues] = useState<
    Record<string, string>
  >({})
  const [applicationSubmitting, setApplicationSubmitting] = useState(false)
  const [quota, setQuota] = useState<{
    allowed: boolean
    used: number
    remaining: number | null
    limit: number | null
    isUnlimited: boolean
    planName: string
  } | null>(null)

  const [positionPage, setPositionPage] = useState(1)
  const [positionTotalPages, setPositionTotalPages] = useState(1)
  const [applicationPage, setApplicationPage] = useState(1)
  const [applicationTotalPages, setApplicationTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)

  const appliedPositionIds = useMemo(() => {
    return new Set(
      applications
        .map((a) =>
          typeof a.position === "object" ? a.position._id : a.position,
        )
        .filter(Boolean),
    )
  }, [applications])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roles: "",
    locations: "",
    industry: "",
    skills: "",
    experience: "any",
    salaryMin: "",
    salaryMax: "",
    employmentType: "full-time",
  })

  const jobsView: ActiveRole =
    session?.user?.role === "both"
      ? activeRole
      : session?.user?.role === "employer"
        ? "employer"
        : "employee"

  useEffect(() => {
    let cancelled = false

    const loadAccess = async () => {
      if (status === "loading") {
        return
      }

      if (status === "unauthenticated") {
        router.replace("/signin")
        if (!cancelled) setAccessLoading(false)
        return
      }

      if (!session?.user?.id) {
        if (!cancelled) setAccessLoading(false)
        return
      }

      if (session.user.role === "both") {
        try {
          const response = await fetch("/api/profile/me", { cache: "no-store" })
          if (!response.ok) throw new Error("Failed to load profile")
          const data = await response.json()
          if (!cancelled) {
            setActiveRole(
              data?.activeRole === "employer" ? "employer" : "employee",
            )
            setCanAccessJobs(true)
            setAccessLoading(false)
          }
          return
        } catch (error) {
          console.error(error)
          if (!cancelled) {
            setActiveRole("employee")
            setCanAccessJobs(true)
            setAccessLoading(false)
          }
          return
        }
      }

      if (session.user.role === "employer") {
        if (!cancelled) {
          setActiveRole("employer")
          setCanAccessJobs(true)
          setAccessLoading(false)
        }
        return
      }

      if (!cancelled) {
        setActiveRole("employee")
        setCanAccessJobs(true)
        setAccessLoading(false)
      }

      return
    }

    void loadAccess()

    return () => {
      cancelled = true
    }
  }, [router, session?.user?.id, session?.user?.role, status])

  useEffect(() => {
    if (session?.user?.id && canAccessJobs) {
      if (jobsView === "employer") {
        loadPositions("employer")
        loadQuota()
      } else {
        loadPositions("employee")
        loadApplications(1, false)
      }
    }
  }, [canAccessJobs, jobsView, session?.user?.id])

  useEffect(() => {
    if (jobsView !== "employee") {
      setCandidateProfile(null)
      return
    }

    let cancelled = false

    const loadCandidateProfile = async () => {
      setCandidateProfileLoading(true)
      try {
        const res = await fetch("/api/profile/me", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load profile")
        const data = (await res.json()) as CandidateProfileResponse
        if (!cancelled) {
          setCandidateProfile(data)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setCandidateProfile(null)
        }
      } finally {
        if (!cancelled) {
          setCandidateProfileLoading(false)
        }
      }
    }

    void loadCandidateProfile()

    return () => {
      cancelled = true
    }
  }, [jobsView])

  useEffect(() => {
    if (jobsView !== "employee" || !canAccessJobs) return
    const timer = setTimeout(() => {
      loadPositions("employee", 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  async function loadQuota() {
    try {
      const res = await fetch("/api/positions/quota", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setQuota(data.quota)
      }
    } catch (error) {
      console.error("Failed to load quota:", error)
    }
  }

  async function loadPositions(view: ActiveRole, page = 1) {
    const isSearch = view === "employee" && searchQuery
    if (isSearch) {
      setSearchLoading(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "10")
      if (view === "employer") {
        params.set("employerId", session?.user?.id || "")
      } else {
        params.set("excludeSwiped", "false")
        if (searchQuery) params.set("search", searchQuery)
      }
      const endpoint =
        view === "employer"
          ? `/api/positions?${params}`
          : `/api/positions/candidates?${params}`
      const res = await fetch(endpoint, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load positions")
      const data = await res.json()
      setPositions(data.positions || [])
      setPositionPage(data.page || 1)
      setPositionTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load positions")
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  async function loadApplications(page = 1, showToast = true) {
    setApplicationsLoading(true)
    try {
      const res = await fetch(
        `/api/positions/applications?page=${page}&limit=10`,
        {
          cache: "no-store",
        },
      )
      if (!res.ok) throw new Error("Failed to load applications")
      const data = await res.json()
      setApplications(data.applications || [])
      setApplicationPage(data.page || 1)
      setApplicationTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error(error)
      if (showToast) toast.error("Failed to load applications")
    } finally {
      setApplicationsLoading(false)
    }
  }

  function getApplicationStatusLabel(status: string) {
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

  function getEmployerAvatar(position: Position) {
    if (typeof position.employerId === "object" && position.employerId) {
      return position.employerId.avatar || ""
    }

    return ""
  }

  function updateApplicationField(
    fieldId: string,
    patch: Partial<ApplicationFormField>,
  ) {
    setApplicationFormDraft((previous) => ({
      ...previous,
      fields: previous.fields.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field,
      ),
    }))
  }

  function addApplicationField() {
    setApplicationFormDraft((previous) => ({
      ...previous,
      fields: [...previous.fields, createApplicationField()],
    }))
  }

  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)

  const onFieldDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingFieldId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const onFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onFieldDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingFieldId || draggingFieldId === targetId) return
    setApplicationFormDraft((previous) => {
      const fields = [...previous.fields]
      const fromIndex = fields.findIndex((f) => f.id === draggingFieldId)
      const toIndex = fields.findIndex((f) => f.id === targetId)
      if (fromIndex === -1 || toIndex === -1) return previous
      const [moved] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, moved)
      return { ...previous, fields }
    })
    setDraggingFieldId(null)
  }

  function removeApplicationField(fieldId: string) {
    setApplicationFormDraft((previous) => ({
      ...previous,
      fields: previous.fields.filter((field) => field.id !== fieldId),
    }))
  }

  function resetApplicationFormDraft() {
    setApplicationFormDraft(createApplicationForm())
  }

  function buildApplicationValues(position: Position) {
    const values: Record<string, string> = {}
    for (const field of position.applicationForm?.fields || []) {
      values[field.id] = getAutofillValue(
        field.autofillSource,
        candidateProfile,
      )
    }
    return values
  }

  function openApplicationDialog(position: Position) {
    setApplicationTarget(position)
    setApplicationValues(buildApplicationValues(position))
    setApplicationDialogOpen(true)
  }

  async function handleApply(
    positionId: string,
    direction: "left" | "right",
    applicationData?: Record<string, string>,
  ) {
    setApplyingPositionId(positionId)

    try {
      const res = await fetch("/api/positions/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, direction, applicationData }),
      })

      if (!res.ok) throw new Error("Failed to process application")

      const data = await res.json()
      setPositions((prev) => prev.filter((item) => item._id !== positionId))

      if (direction === "right") {
        toast.success(
          data?.matched
            ? "It’s a match! You can now message this recruiter."
            : "Application sent",
        )
      }
      await loadApplications()
    } catch (error) {
      console.error(error)
      toast.error("Failed to apply to job")
    } finally {
      setApplyingPositionId(null)
    }
  }

  async function handleApplicationSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!applicationTarget) return

    setApplicationSubmitting(true)
    try {
      await handleApply(applicationTarget._id, "right", applicationValues)
      setApplicationDialogOpen(false)
      setApplicationTarget(null)
      setApplicationValues({})
    } finally {
      setApplicationSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const applicationForm = {
        ...applicationFormDraft,
        fields: applicationFormDraft.fields.filter((field) =>
          field.label.trim(),
        ),
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        roles: formData.roles
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        locations: formData.locations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        industry: formData.industry,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: formData.experience,
        salaryRange: {
          min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
          max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
          currency: "INR",
        },
        employmentType: formData.employmentType,
        applicationForm:
          applicationForm.fields.length > 0 ? applicationForm : undefined,
      }

      if (editingId) {
        const res = await fetch(`/api/positions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update position")
        toast.success("Position updated")
      } else {
        const res = await fetch("/api/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          if (res.status === 429) {
            const error = await res.json()
            toast.error(
              `Job posting limit reached. You've used ${error.used}/${error.limit} posts on your ${error.plan} plan.`,
            )
            setOpenDialog(false)
            router.push("/subscription")
            return
          }
          const error = await res.json()
          throw new Error(error.error || "Failed to create position")
        }

        toast.success("Position created")
        await loadQuota()
      }

      resetForm()
      setOpenDialog(false)
      await loadPositions(jobsView)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Operation failed")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublish(positionId: string) {
    try {
      const res = await fetch(`/api/positions/${positionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })
      if (!res.ok) throw new Error("Failed to publish position")
      toast.success("Position published")
      await loadPositions(jobsView)
    } catch (error) {
      console.error(error)
      toast.error("Failed to publish position")
    }
  }

  async function handleToggleVisibility(
    positionId: string,
    isVisible: boolean,
  ) {
    try {
      const res = await fetch(`/api/positions/${positionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      })
      if (!res.ok) throw new Error("Failed to update visibility")
      await loadPositions(jobsView)
    } catch (error) {
      console.error(error)
      toast.error("Failed to update visibility")
    }
  }

  async function handleDelete(positionId: string) {
    if (!confirm("Are you sure you want to delete this position?")) return

    try {
      const res = await fetch(`/api/positions/${positionId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete position")
      toast.success("Position deleted")
      await loadPositions(jobsView)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete position")
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      roles: "",
      locations: "",
      industry: "",
      skills: "",
      experience: "any",
      salaryMin: "",
      salaryMax: "",
      employmentType: "full-time",
    })
    resetApplicationFormDraft()
    setEditingId(null)
  }

  function handleEdit(position: Position) {
    router.push(`/dashboard/jobs/${position._id}/edit`)
  }

  if (status === "loading" || accessLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!canAccessJobs) {
    return null
  }

  return (
    <div className="flex w-full max-w-[1600px] flex-col gap-4 px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {jobsView === "employer" ? "Job Openings" : "Available Jobs"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobsView === "employer"
              ? "Manage your job postings and review interested candidates"
              : "Browse job posts from recruiters and apply directly from here"}
          </p>
          {jobsView === "employer" && quota && (
            <div className="mt-3 flex items-center gap-2">
              {quota.isUnlimited ? (
                <Badge variant="secondary">Unlimited job posts</Badge>
              ) : (
                <>
                  <Badge variant={quota.allowed ? "default" : "destructive"}>
                    {quota.remaining}/{quota.limit} posts available
                  </Badge>
                  {!quota.allowed && (
                    <Badge variant="outline">Upgrade to post more</Badge>
                  )}
                </>
              )}
              <span className="text-xs text-muted-foreground">
                ({quota.planName})
              </span>
            </div>
          )}
        </div>
        {jobsView === "employer" ? (
          <Button
            onClick={() => router.push("/dashboard/jobs/new")}
            disabled={!!(quota && !quota.allowed)}
          >
            <Plus className="h-4 w-4" />
            New Position
          </Button>
        ) : null}
      </div>

      {jobsView === "employee" ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, company, or keyword..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPositionPage(1)
                }}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
            )}
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/dashboard/jobs/applied">View Applied</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : positions.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">
                {searchQuery
                  ? "No jobs match your search"
                  : "No jobs available right now"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try different keywords or check back later."
                  : "Check back later for new recruiter posts"}
              </p>
            </Card>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 [&>div]:break-inside-avoid">
                {positions.map((position) => (
                  <Card key={position._id} className="p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={getEmployerAvatar(position)} />
                          <AvatarFallback>
                            {getEmployerName(position).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">
                              {position.title}
                            </h3>
                            <Badge variant="secondary">Recruiter post</Badge>
                            {appliedPositionIds.has(position._id) && (
                              <Badge variant="default">Applied</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {getEmployerName(position)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {position.employmentType}
                      </Badge>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                      {position.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
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
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          if (position.slug) {
                            router.push(`/job/${position.slug}`)
                          } else {
                            router.push(`/dashboard/jobs/${position._id}`)
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {positionTotalPages > 1 && (
                <div className="flex justify-center">
                  <PaginationControls
                    page={positionPage}
                    totalPages={positionTotalPages}
                    onPageChange={(p) => loadPositions("employee", p)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {positions.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No job openings yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first job opening to start receiving applications
              </p>
            </Card>
          ) : (
            positions.map((position) => (
              <Card key={position._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{position.title}</h3>
                      <Badge
                        variant={
                          position.status === "active" ? "default" : "secondary"
                        }
                      >
                        {position.status}
                      </Badge>
                      {!position.isVisible && (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {position.description.substring(0, 100)}...
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      {position.locations?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {position.locations.join(", ")}
                        </div>
                      )}

                      {position.salaryRange?.min && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          ₹{position.salaryRange.min.toLocaleString()} - ₹
                          {position.salaryRange.max?.toLocaleString() || "Open"}
                        </div>
                      )}

                      {position.matchCount > 0 && (
                        <button
                          onClick={() =>
                            router.push(`/dashboard/jobs/${position._id}`)
                          }
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Users className="h-4 w-4" />
                          {position.matchCount} interested
                        </button>
                      )}

                      {position.slug && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/job/${position.slug}`,
                            )
                            toast.success("Share link copied to clipboard")
                          }}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-4 w-4" />
                          Copy share link
                        </button>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
                      {position.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => handlePublish(position._id)}
                        >
                          Publish
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleVisibility(
                            position._id,
                            position.isVisible,
                          )
                        }
                      >
                        {position.isVisible ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/jobs/${position._id}`)
                        }
                      >
                        <Users className="h-4 w-4" />
                        View Applicants
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleEdit(position)}>
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>

                      {position.slug && (
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/job/${position.slug}`,
                            )
                            toast.success("Share link copied!")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copy share link
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleDelete(position._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
          {positionTotalPages > 1 && (
            <div className="flex justify-center">
              <PaginationControls
                page={positionPage}
                totalPages={positionTotalPages}
                onPageChange={(p) => loadPositions("employer", p)}
              />
            </div>
          )}
        </div>
      )}

      <Dialog
        open={applicationDialogOpen}
        onOpenChange={setApplicationDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {applicationTarget?.applicationForm?.title || "Application form"}
            </DialogTitle>
            <DialogDescription>
              {applicationTarget?.applicationForm?.description ||
                "Tell us a bit more about yourself."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplicationSubmit} className="space-y-4">
            {applicationTarget?.applicationForm?.fields?.map((field) => {
              const value = applicationValues[field.id] || ""
              const autofillValue = getAutofillValue(
                field.autofillSource,
                candidateProfile,
              )
              const isAutofilled =
                field.autofillSource !== "none" && Boolean(autofillValue)

              return (
                <div
                  key={field.id}
                  className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor={`application-field-${field.id}`}
                      className="text-sm font-medium"
                    >
                      {field.label || "Untitled question"}
                      {field.required ? " *" : ""}
                    </Label>
                    {isAutofilled ? (
                      <Badge variant="secondary" className="shrink-0">
                        Autofilled
                      </Badge>
                    ) : null}
                  </div>

                  {field.type === "long-text" ? (
                    <Textarea
                      id={`application-field-${field.id}`}
                      value={value}
                      placeholder={field.placeholder}
                      rows={4}
                      required={field.required}
                      onChange={(event) =>
                        setApplicationValues((previous) => ({
                          ...previous,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={value}
                      onValueChange={(nextValue) =>
                        setApplicationValues((previous) => ({
                          ...previous,
                          [field.id]: nextValue,
                        }))
                      }
                    >
                      <SelectTrigger id={`application-field-${field.id}`}>
                        <SelectValue
                          placeholder={field.placeholder || "Select an option"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`application-field-${field.id}`}
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "email"
                            ? "email"
                            : field.type === "url"
                              ? "url"
                              : field.type === "phone"
                                ? "tel"
                                : field.type === "date"
                                  ? "date"
                                  : "text"
                      }
                      value={value}
                      placeholder={field.placeholder}
                      required={field.required}
                      onChange={(event) =>
                        setApplicationValues((previous) => ({
                          ...previous,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
                  )}

                  {field.autofillSource !== "none" && (
                    <p className="text-xs text-muted-foreground">
                      {isAutofilled
                        ? "Filled from your profile. You can edit it before applying."
                        : "This field will use your profile when available."}
                    </p>
                  )}
                </div>
              )
            })}

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={applicationSubmitting}
              >
                {applicationSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Submit application
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApplicationDialogOpen(false)
                  setApplicationTarget(null)
                  setApplicationValues({})
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
