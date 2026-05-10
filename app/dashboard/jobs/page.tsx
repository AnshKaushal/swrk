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
  DialogTrigger,
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
} from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
}

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(true)
  const [canAccessJobs, setCanAccessJobs] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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

      if (session.user.role === "employer") {
        if (!cancelled) {
          setCanAccessJobs(true)
          setAccessLoading(false)
        }
        return
      }

      if (session.user.role === "both") {
        try {
          const response = await fetch("/api/profile/me", { cache: "no-store" })
          if (!response.ok) throw new Error("Failed to load profile")
          const data = await response.json()
          const isEmployerMode = data?.activeRole === "employer"

          if (!cancelled) {
            setCanAccessJobs(isEmployerMode)
            setAccessLoading(false)
          }

          if (!isEmployerMode) {
            router.replace("/dashboard")
          }
          return
        } catch (error) {
          console.error(error)
        }
      }

      if (!cancelled) {
        setCanAccessJobs(false)
        setAccessLoading(false)
      }
      router.replace("/dashboard")
    }

    void loadAccess()

    return () => {
      cancelled = true
    }
  }, [router, session?.user?.id, session?.user?.role, status])

  useEffect(() => {
    if (session?.user?.id && canAccessJobs) {
      loadPositions()
      loadQuota()
    }
  }, [canAccessJobs, session?.user?.id])

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

  async function loadPositions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/positions?employerId=${session?.user?.id}`)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
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
          currency: "USD",
        },
        employmentType: formData.employmentType,
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
      await loadPositions()
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
      await loadPositions()
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
      await loadPositions()
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
      await loadPositions()
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
    setEditingId(null)
  }

  function handleEdit(position: Position) {
    setFormData({
      title: position.title,
      description: position.description,
      roles: position.roles?.join(", ") || "",
      locations: position.locations?.join(", ") || "",
      industry: position.industry || "",
      skills: position.skills?.join(", ") || "",
      experience: position.experience,
      salaryMin: position.salaryRange?.min?.toString() || "",
      salaryMax: position.salaryRange?.max?.toString() || "",
      employmentType: position.employmentType,
    })
    setEditingId(position._id)
    setOpenDialog(true)
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
          <h1 className="text-2xl font-bold">Job Openings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your job postings and view interested candidates
          </p>
          {quota && (
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
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setOpenDialog(true)
              }}
              disabled={!!(quota && !quota.allowed)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Position
            </Button>
          </DialogTrigger>
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
                    setFormData({ ...formData, description: e.target.value })
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
                  <Label htmlFor="locations">Locations (comma-separated)</Label>
                  <Input
                    id="locations"
                    value={formData.locations}
                    onChange={(e) =>
                      setFormData({ ...formData, locations: e.target.value })
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
                  <Label htmlFor="salaryMin">Salary Min ($)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMin: e.target.value })
                    }
                    placeholder="e.g., 120000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Salary Max ($)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMax: e.target.value })
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

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      </div>

      {positions.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No job openings yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first job opening to start receiving applications
          </p>
        </Card>
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
                        ${position.salaryRange.min.toLocaleString()} - $
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
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleEdit(position)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleDelete(position._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
