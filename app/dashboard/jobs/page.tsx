"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
        loadApplications()
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

  async function loadPositions(view: ActiveRole) {
    setLoading(true)
    try {
      const endpoint =
        view === "employer"
          ? `/api/positions?employerId=${session?.user?.id}`
          : "/api/positions/candidates?limit=50"
      const res = await fetch(endpoint, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load positions")
      const data = await res.json()
      setPositions(data.positions || [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load positions")
    } finally {
      setLoading(false)
    }
  }

  async function loadApplications() {
    setApplicationsLoading(true)
    try {
      const res = await fetch("/api/positions/applications?limit=50", {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load applications")
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load applications")
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
          <>
            <Button
              onClick={() => router.push("/dashboard/jobs/new")}
              disabled={!!(quota && !quota.allowed)}
            >
              <Plus className="h-4 w-4" />
              New Position
            </Button>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Position" : "Create New Position"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details for your job opening
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Senior React Developer"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Job description and responsibilities"
                      required
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roles">Roles (comma-separated)</Label>
                      <Input
                        id="roles"
                        value={formData.roles}
                        onChange={(e) =>
                          setFormData({ ...formData, roles: e.target.value })
                        }
                        placeholder="e.g., Backend, Frontend"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locations">
                        Locations (comma-separated)
                      </Label>
                      <Input
                        id="locations"
                        value={formData.locations}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            locations: e.target.value,
                          })
                        }
                        placeholder="e.g., San Francisco, Remote"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) =>
                          setFormData({ ...formData, industry: e.target.value })
                        }
                        placeholder="e.g., Technology"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select
                        value={formData.experience}
                        onValueChange={(value) =>
                          setFormData({ ...formData, experience: value })
                        }
                      >
                        <SelectTrigger id="experience">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">
                      Required Skills (comma-separated)
                    </Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      onChange={(e) =>
                        setFormData({ ...formData, skills: e.target.value })
                      }
                      placeholder="e.g., React, Node.js, PostgreSQL"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Salary Min (INR)</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salaryMin: e.target.value,
                          })
                        }
                        placeholder="e.g., 120000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Salary Max (INR)</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salaryMax: e.target.value,
                          })
                        }
                        placeholder="e.g., 180000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select
                        value={formData.employmentType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, employmentType: value })
                        }
                      >
                        <SelectTrigger id="employmentType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Application form
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Build custom questions and autofill candidate profile
                          fields when available.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addApplicationField}
                      >
                        <Plus className="h-4 w-4" />
                        Add question
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="applicationTitle">Form title</Label>
                        <Input
                          id="applicationTitle"
                          value={applicationFormDraft.title}
                          onChange={(event) =>
                            setApplicationFormDraft((previous) => ({
                              ...previous,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Application form"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="applicationDescription">
                          Form description
                        </Label>
                        <Textarea
                          id="applicationDescription"
                          value={applicationFormDraft.description}
                          onChange={(event) =>
                            setApplicationFormDraft((previous) => ({
                              ...previous,
                              description: event.target.value,
                            }))
                          }
                          placeholder="Tell candidates what you want to know"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {applicationFormDraft.fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
                          Add questions to collect candidate details.
                        </div>
                      ) : (
                        applicationFormDraft.fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="rounded-2xl border border-border/60 bg-background p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`field-label-${field.id}`}>
                                      Question {index + 1}
                                    </Label>
                                    <Input
                                      id={`field-label-${field.id}`}
                                      value={field.label}
                                      onChange={(event) => {
                                        const nextLabel = event.target.value
                                        const infer =
                                          inferFieldFromLabel(nextLabel)
                                        if (infer) {
                                          const patch: any = {
                                            label: nextLabel,
                                          }
                                          if (
                                            field.type === "short-text" &&
                                            infer.type
                                          )
                                            patch.type = infer.type
                                          if (
                                            field.autofillSource === "none" &&
                                            infer.autofill
                                          )
                                            patch.autofillSource =
                                              infer.autofill
                                          if (
                                            infer.options &&
                                            field.type !== "select"
                                          ) {
                                            patch.type = "select"
                                            patch.options = infer.options
                                          }
                                          updateApplicationField(
                                            field.id,
                                            patch,
                                          )
                                          return
                                        }

                                        updateApplicationField(field.id, {
                                          label: nextLabel,
                                        })
                                      }}
                                      placeholder="Example: What is your current notice period?"
                                      draggable
                                      onDragStart={onFieldDragStart(field.id)}
                                      onDragOver={onFieldDragOver}
                                      onDrop={onFieldDrop(field.id)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`field-type-${field.id}`}>
                                      Type
                                    </Label>
                                    <Select
                                      value={field.type}
                                      onValueChange={(value) =>
                                        updateApplicationField(field.id, {
                                          type: value as ApplicationFieldType,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id={`field-type-${field.id}`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="short-text">
                                          Short answer
                                        </SelectItem>
                                        <SelectItem value="long-text">
                                          Paragraph
                                        </SelectItem>
                                        <SelectItem value="email">
                                          Email
                                        </SelectItem>
                                        <SelectItem value="number">
                                          Number
                                        </SelectItem>
                                        <SelectItem value="select">
                                          Dropdown
                                        </SelectItem>
                                        <SelectItem value="url">
                                          Link
                                        </SelectItem>
                                        <SelectItem value="phone">
                                          Phone
                                        </SelectItem>
                                        <SelectItem value="date">
                                          Date
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`field-autofill-${field.id}`}
                                    >
                                      Autofill from candidate profile
                                    </Label>
                                    <Select
                                      value={field.autofillSource}
                                      onValueChange={(value) =>
                                        updateApplicationField(field.id, {
                                          autofillSource:
                                            value as ApplicationAutofillSource,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id={`field-autofill-${field.id}`}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          None
                                        </SelectItem>
                                        <SelectItem value="name">
                                          Name
                                        </SelectItem>
                                        <SelectItem value="email">
                                          Email
                                        </SelectItem>
                                        <SelectItem value="phone">
                                          Phone
                                        </SelectItem>
                                        <SelectItem value="headline">
                                          Headline
                                        </SelectItem>
                                        <SelectItem value="bio">Bio</SelectItem>
                                        <SelectItem value="location">
                                          Location
                                        </SelectItem>
                                        <SelectItem value="skills">
                                          Skills
                                        </SelectItem>
                                        <SelectItem value="experienceYears">
                                          Years of experience
                                        </SelectItem>
                                        <SelectItem value="resumeUrl">
                                          Resume URL
                                        </SelectItem>
                                        <SelectItem value="linkedin">
                                          LinkedIn
                                        </SelectItem>
                                        <SelectItem value="github">
                                          GitHub
                                        </SelectItem>
                                        <SelectItem value="portfolio">
                                          Portfolio
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`field-placeholder-${field.id}`}
                                    >
                                      Placeholder
                                    </Label>
                                    <Input
                                      id={`field-placeholder-${field.id}`}
                                      value={field.placeholder}
                                      onChange={(event) =>
                                        updateApplicationField(field.id, {
                                          placeholder: event.target.value,
                                        })
                                      }
                                      placeholder="Visible helper text"
                                    />
                                  </div>

                                  <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
                                    <input
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={(event) =>
                                        updateApplicationField(field.id, {
                                          required: event.target.checked,
                                        })
                                      }
                                      className="h-4 w-4 rounded border-border"
                                    />
                                    Required question
                                  </label>

                                  {field.type === "select" && (
                                    <div className="space-y-2 md:col-span-2">
                                      <Label
                                        htmlFor={`field-options-${field.id}`}
                                      >
                                        Options, one per line
                                      </Label>
                                      <Textarea
                                        id={`field-options-${field.id}`}
                                        value={field.options.join("\n")}
                                        onChange={(event) =>
                                          updateApplicationField(field.id, {
                                            options: event.target.value
                                              .split("\n")
                                              .map((option) => option.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        placeholder="Option 1\nOption 2\nOption 3"
                                        rows={3}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeApplicationField(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {editingId ? "Update Position" : "Create Position"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpenDialog(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>

      {positions.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">
            {jobsView === "employer"
              ? "No job openings yet"
              : "No jobs available right now"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {jobsView === "employer"
              ? "Create your first job opening to start receiving applications"
              : "Check back later for new recruiter posts"}
          </p>
        </Card>
      ) : jobsView === "employee" ? (
        <div className="space-y-6">
          <Card className="p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">My applications</h2>
                <p className="text-sm text-muted-foreground">
                  Track every application and see where each employer stands.
                </p>
              </div>
            </div>

            {applicationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                You have not applied to any jobs yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                {applications.map((application) => (
                  <div
                    key={application._id}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {application.position.title}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {getEmployerName(application.position)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated{" "}
                        {new Date(
                          application.applicationStatusUpdatedAt ||
                            application.applicationSubmittedAt ||
                            application.position.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {getApplicationStatusLabel(
                          application.applicationStatus,
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/jobs/${application.position._id}`,
                          )
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
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

                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleApply(position._id, "left")}
                    disabled={applyingPositionId === position._id}
                  >
                    <X className="h-4 w-4" />
                    Skip
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (position.applicationForm?.fields?.length) {
                        openApplicationDialog(position)
                        return
                      }

                      void handleApply(position._id, "right")
                    }}
                    disabled={
                      applyingPositionId === position._id ||
                      candidateProfileLoading
                    }
                  >
                    {applyingPositionId === position._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                    Apply
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {positions.map((position) => (
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
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {position.status === "draft" && (
                      <DropdownMenuItem
                        onClick={() => handlePublish(position._id)}
                      >
                        Publish
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() =>
                        handleToggleVisibility(position._id, position.isVisible)
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

                    <DropdownMenuItem onClick={() => handleEdit(position)}>
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

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
          ))}
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
