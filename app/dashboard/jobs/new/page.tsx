"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type ActiveRole = "employee" | "employer"

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

type ApplicationFormField = {
  id: string
  label: string
  type: ApplicationFieldType
  required: boolean
  placeholder: string
  options: string[]
  autofillSource: ApplicationAutofillSource
}

type ApplicationFormConfig = {
  title: string
  description: string
  fields: ApplicationFormField[]
}

const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Product Designer",
  "DevOps Engineer",
  "Data Analyst",
]

const LOCATION_SUGGESTIONS = [
  "Remote",
  "Bengaluru",
  "Delhi",
  "Mumbai",
  "Hyderabad",
  "Pune",
]

const SKILL_SUGGESTIONS = [
  "React",
  "TypeScript",
  "Node.js",
  "MongoDB",
  "PostgreSQL",
  "Figma",
]

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

function MultiValueInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
  suggestions: string[]
}) {
  const [draft, setDraft] = useState("")

  const addValue = (value: string) => {
    const nextValue = value.trim()
    if (!nextValue) return
    if (values.some((item) => item.toLowerCase() === nextValue.toLowerCase())) {
      setDraft("")
      return
    }
    onChange([...values, nextValue])
    setDraft("")
  }

  const removeValue = (value: string) => {
    onChange(values.filter((item) => item !== value))
  }

  const toggleSuggestion = (value: string) => {
    if (values.includes(value)) {
      removeValue(value)
      return
    }
    addValue(value)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              addValue(draft)
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => addValue(draft)}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => {
          const selected = values.includes(item)
          return (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={() => toggleSuggestion(item)}
            >
              {item}
            </Button>
          )
        })}
      </div>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {item}
              <button
                type="button"
                onClick={() => removeValue(item)}
                className="rounded-sm hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function NewJobPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [accessLoading, setAccessLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [industry, setIndustry] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [experience, setExperience] = useState("any")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [employmentType, setEmploymentType] = useState("full-time")
  const [externalLink, setExternalLink] = useState("")
  const [isExternal, setIsExternal] = useState(false)
  const [company, setCompany] = useState("")

  const [applicationForm, setApplicationForm] = useState<ApplicationFormConfig>(
    createApplicationForm(),
  )

  useEffect(() => {
    let cancelled = false

    const loadAccess = async () => {
      if (status === "loading") return

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
          setCanCreate(true)
          setAccessLoading(false)
        }
        return
      }

      if (session.user.role === "both") {
        try {
          const response = await fetch("/api/profile/me", { cache: "no-store" })
          if (!response.ok) throw new Error("Failed to load profile")
          const data = await response.json()
          const activeRole: ActiveRole =
            data?.activeRole === "employer" ? "employer" : "employee"

          if (!cancelled) {
            setCanCreate(activeRole === "employer")
            setAccessLoading(false)
          }

          if (activeRole !== "employer") {
            router.replace("/dashboard/jobs")
          }
          return
        } catch {
          if (!cancelled) {
            setCanCreate(false)
            setAccessLoading(false)
          }
          router.replace("/dashboard/jobs")
          return
        }
      }

      if (!cancelled) {
        setCanCreate(false)
        setAccessLoading(false)
      }
      router.replace("/dashboard/jobs")
    }

    void loadAccess()

    return () => {
      cancelled = true
    }
  }, [router, session?.user?.id, session?.user?.role, status])

  const addQuestion = () => {
    setApplicationForm((previous) => ({
      ...previous,
      fields: [...previous.fields, createApplicationField()],
    }))
  }

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return
    setApplicationForm((previous) => {
      const fields = [...previous.fields]
      const fromIndex = fields.findIndex((f) => f.id === draggingId)
      const toIndex = fields.findIndex((f) => f.id === targetId)
      if (fromIndex === -1 || toIndex === -1) return previous
      const [moved] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, moved)
      return { ...previous, fields }
    })
    setDraggingId(null)
  }

  const removeQuestion = (id: string) => {
    setApplicationForm((previous) => ({
      ...previous,
      fields: previous.fields.filter((field) => field.id !== id),
    }))
  }

  const updateQuestion = (id: string, patch: Partial<ApplicationFormField>) => {
    setApplicationForm((previous) => ({
      ...previous,
      fields: previous.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const cleanedForm = {
        ...applicationForm,
        fields: applicationForm.fields
          .filter((field) => field.label.trim())
          .map((field) => ({
            ...field,
            options:
              field.type === "select"
                ? field.options.map((option) => option.trim()).filter(Boolean)
                : [],
          })),
      }

      const payload = {
        title,
        description,
        roles,
        locations,
        industry,
        skills,
        experience,
        salaryRange: {
          min: salaryMin ? parseInt(salaryMin) : undefined,
          max: salaryMax ? parseInt(salaryMax) : undefined,
          currency: "INR",
        },
        employmentType,
        applicationForm:
          cleanedForm.fields.length > 0 ? cleanedForm : undefined,
        company: company || undefined,
        externalLink: externalLink || undefined,
        isExternal: isExternal || undefined,
      }

      const response = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        if (response.status === 429) {
          toast.error(
            `Job posting limit reached. You've used ${error.used}/${error.limit} posts on your ${error.plan} plan.`,
          )
          router.push("/subscription")
          return
        }

        throw new Error(error?.error || "Failed to create position")
      }

      toast.success("Position created")
      router.push("/dashboard/jobs")
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create position",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!canCreate) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create New Position</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a structured job post with mapped fields and a custom
            candidate form.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/jobs")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="rounded-3xl border-border/60 p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Senior Frontend Engineer"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does this role own, and what outcomes matter most?"
                rows={5}
                required
              />
            </div>

            <MultiValueInput
              label="Roles"
              values={roles}
              onChange={setRoles}
              placeholder="Add role"
              suggestions={ROLE_SUGGESTIONS}
            />

            <MultiValueInput
              label="Locations"
              values={locations}
              onChange={setLocations}
              placeholder="Add location"
              suggestions={LOCATION_SUGGESTIONS}
            />

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="Technology"
              />
            </div>

            <MultiValueInput
              label="Skills"
              values={skills}
              onChange={setSkills}
              placeholder="Add skill"
              suggestions={SKILL_SUGGESTIONS}
            />

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger id="experience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger id="employmentType" className="w-full">
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

            <div className="space-y-2">
              <Label htmlFor="salaryMin">Salary Min (INR)</Label>
              <Input
                id="salaryMin"
                type="number"
                value={salaryMin}
                onChange={(event) => setSalaryMin(event.target.value)}
                placeholder="120000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax">Salary Max (INR)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={salaryMax}
                onChange={(event) => setSalaryMax(event.target.value)}
                placeholder="180000"
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-border/60 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">External Application Link</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            If this job is hosted elsewhere, enable external mode so applicants
            submit their details and then get redirected.
          </p>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              This is an external posting
            </label>

            {isExternal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                  />
                  <p className="text-xs text-muted-foreground">
                    The company name shown to candidates in the swipe deck
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="externalLink">External Application URL</Label>
                  <Input
                    id="externalLink"
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://company.workable.com/jobs/123"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="rounded-3xl border-border/60 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Application Form Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Add custom questions and map them to candidate profile fields
                for autofill.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4" />
              Add question
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applicationTitle">Form Title</Label>
              <Input
                id="applicationTitle"
                value={applicationForm.title}
                onChange={(event) =>
                  setApplicationForm((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                placeholder="Application form"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationDescription">Form Description</Label>
              <Textarea
                id="applicationDescription"
                value={applicationForm.description}
                onChange={(event) =>
                  setApplicationForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Tell candidates what details you need."
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {applicationForm.fields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                No questions yet. Add one to start building your candidate
                application flow.
              </div>
            ) : (
              applicationForm.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-border/60 bg-muted/10 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Question {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeQuestion(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`field-label-${field.id}`}>Label</Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(event) => {
                          const nextLabel = event.target.value
                          const infer = inferFieldFromLabel(nextLabel)
                          if (infer) {
                            const patch: any = { label: nextLabel }
                            if (field.type === "short-text" && infer.type)
                              patch.type = infer.type
                            if (
                              field.autofillSource === "none" &&
                              infer.autofill
                            )
                              patch.autofillSource = infer.autofill
                            if (infer.options && field.type !== "select") {
                              patch.type = "select"
                              patch.options = infer.options
                            }
                            updateQuestion(field.id, patch)
                            return
                          }

                          updateQuestion(field.id, { label: nextLabel })
                        }}
                        placeholder="What is your notice period?"
                        draggable
                        onDragStart={onDragStart(field.id)}
                        onDragOver={onDragOver}
                        onDrop={onDrop(field.id)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`field-type-${field.id}`}>
                        Input Type
                      </Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateQuestion(field.id, {
                            type: value as ApplicationFieldType,
                          })
                        }
                      >
                        <SelectTrigger
                          id={`field-type-${field.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short-text">
                            Short answer
                          </SelectItem>
                          <SelectItem value="long-text">Paragraph</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Dropdown</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`field-autofill-${field.id}`}>
                        Autofill Source
                      </Label>
                      <Select
                        value={field.autofillSource}
                        onValueChange={(value) =>
                          updateQuestion(field.id, {
                            autofillSource: value as ApplicationAutofillSource,
                          })
                        }
                      >
                        <SelectTrigger
                          id={`field-autofill-${field.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="headline">Headline</SelectItem>
                          <SelectItem value="bio">Bio</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="skills">Skills</SelectItem>
                          <SelectItem value="experienceYears">
                            Experience Years
                          </SelectItem>
                          <SelectItem value="resumeUrl">Resume URL</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="portfolio">Portfolio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`field-placeholder-${field.id}`}>
                        Placeholder
                      </Label>
                      <Input
                        id={`field-placeholder-${field.id}`}
                        value={field.placeholder}
                        onChange={(event) =>
                          updateQuestion(field.id, {
                            placeholder: event.target.value,
                          })
                        }
                        placeholder="Visible helper text"
                      />
                    </div>

                    {field.type === "select" ? (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`field-options-${field.id}`}>
                          Options (one per line)
                        </Label>
                        <Textarea
                          id={`field-options-${field.id}`}
                          value={field.options.join("\n")}
                          onChange={(event) =>
                            updateQuestion(field.id, {
                              options: event.target.value.split("\n"),
                            })
                          }
                          rows={3}
                          placeholder="Immediate\n15 days\n30 days"
                        />
                      </div>
                    ) : null}

                    <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateQuestion(field.id, {
                            required: Boolean(checked),
                          })
                        }
                      />
                      <div>
                        <p className="text-sm font-medium">Required question</p>
                        <p className="text-xs text-muted-foreground">
                          Candidate must answer this before applying.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting} className="min-w-44">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish job draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/jobs")}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
