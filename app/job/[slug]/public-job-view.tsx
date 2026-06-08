"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Markdown } from "@/components/ui/markdown"
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  ExternalLink,
  Loader2,
  CheckCircle,
  Heart,
  FileText,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type ApplicationFormField = {
  id: string
  label: string
  type: string
  required: boolean
  placeholder: string
  options: string[]
  autofillSource: string
}

type PublicPosition = {
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
  externalLink?: string
  isExternal?: boolean
  applicationForm?: {
    title?: string
    description?: string
    fields: ApplicationFormField[]
  }
  employerId: {
    _id: string
    name?: string
    avatar?: string
    companyName?: string
  }
}

export function PublicJobView({ position }: { position: PublicPosition }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [directApplying, setDirectApplying] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplied, setCheckingApplied] = useState(true)

  useEffect(() => {
    if (!position._id) {
      setCheckingApplied(false)
      return
    }
    fetch(`/api/positions/swipe?positionId=${position._id}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setHasApplied(data.applied)
      })
      .catch(() => {
        setHasApplied(false)
      })
      .finally(() => setCheckingApplied(false))
  }, [position._id])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [location, setLocation] = useState("")
  const [workExperience, setWorkExperience] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState("")
  const [resumeFileName, setResumeFileName] = useState("")

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [applicationValues, setApplicationValues] = useState<
    Record<string, string>
  >({})
  const [directResumeFile, setDirectResumeFile] = useState<File | null>(null)
  const [directResumeUploading, setDirectResumeUploading] = useState(false)
  const [directResumeUrl, setDirectResumeUrl] = useState("")
  const [directResumeFileName, setDirectResumeFileName] = useState("")

  const hasApplicationForm =
    position.applicationForm?.fields &&
    position.applicationForm.fields.length > 0

  const handleDirectResumeSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, or TXT file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB")
      return
    }
    setDirectResumeUploading(true)
    setDirectResumeFile(file)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/resume", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }
      const data = await res.json()
      setDirectResumeUrl(data.url)
      setDirectResumeFileName(data.fileName)
      toast.success("Resume uploaded")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload resume",
      )
      setDirectResumeFile(null)
    } finally {
      setDirectResumeUploading(false)
    }
  }

  const handleDirectApply = async () => {
    if (!session?.user?.id) {
      router.push("/signin")
      return
    }
    setConfirmDialogOpen(false)
    setDirectApplying(true)
    try {
      const res = await fetch("/api/positions/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId: position._id,
          direction: "right",
          resumeUrl: directResumeUrl || undefined,
          resumeFileName: directResumeFileName || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to apply")
      setSubmitted(true)
      toast.success("Application submitted!")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to apply",
      )
    } finally {
      setDirectApplying(false)
    }
  }

  const submitApplication = async (extraData?: Record<string, string>) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/positions/${position._id}/apply-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          linkedin,
          location,
          workExperience,
          agreedToTerms,
          resumeUrl,
          resumeFileName,
          applicationData: extraData || {},
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setAlreadyApplied(true)
          return
        }
        throw new Error(data.error || "Failed to submit application")
      }

      if (data.externalLink) {
        window.open(data.externalLink, "_blank")
      }

      setSubmitted(true)

      if (!data.hasAccount) {
        setShowSignupPrompt(true)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit application",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleResumeUpload = async (file: File) => {
    setResumeUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/resume", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }
      const data = await res.json()
      setResumeUrl(data.url)
      setResumeFileName(data.fileName)
      toast.success("Resume uploaded")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload resume",
      )
      setResumeFile(null)
    } finally {
      setResumeUploading(false)
    }
  }

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, or TXT file")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB")
      return
    }
    setResumeFile(file)
    handleResumeUpload(file)
  }

  const handleRemoveResume = () => {
    setResumeFile(null)
    setResumeUrl("")
    setResumeFileName("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasApplicationForm) {
      setFormDialogOpen(true)
      return
    }
    await submitApplication()
  }

  const handleFinalSubmit = async () => {
    setFormDialogOpen(false)
    await submitApplication(applicationValues)
  }

  if (alreadyApplied) {
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-2xl items-center justify-center px-4">
        <Card className="w-full p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-blue-500" />
          <h1 className="mt-4 text-2xl font-bold">Already Applied</h1>
          <p className="mt-2 text-muted-foreground">
            You have already submitted an application for{" "}
            {position.title}. The recruiter will review it and
            contact you if your profile matches.
          </p>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <>
        <div className="mx-auto flex min-h-[80dvh] max-w-2xl items-center justify-center px-4">
          <Card className="w-full p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold">Application Submitted!</h1>
            <p className="mt-2 text-muted-foreground">
              Your application for {position.title} has been received. The
              recruiter will review it and contact you if your profile matches.
            </p>
          </Card>
        </div>
        <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create an account to track your application</DialogTitle>
              <DialogDescription>
                Sign up to see when the recruiter views your profile, send
                messages, and get matched instantly.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  window.location.href = "/signup"
                }}
              >
                Create Account
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSignupPrompt(false)}
              >
                Maybe later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const companyName =
    position.employerId?.companyName || position.employerId?.name || "Company"

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {companyName}
              </div>
              <h1 className="mt-2 text-3xl font-bold">{position.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {position.locations?.map((loc) => (
                  <Badge key={loc} variant="secondary">
                    <MapPin className="mr-1 h-3 w-3" />
                    {loc}
                  </Badge>
                ))}
                <Badge variant="outline">{position.employmentType}</Badge>
                <Badge variant="outline" className="capitalize">
                  {position.experience}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border p-6">
              <Markdown>{position.description}</Markdown>
            </div>

            {position.skills?.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {position.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <Card className="sticky top-24 p-6">
              {checkingApplied ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : hasApplied ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                  <h2 className="mt-3 text-lg font-semibold">Applied</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You have already applied for this position.
                  </p>
                </div>
              ) : (<>
                <h2 className="text-lg font-semibold">
                  {position.isExternal ? "Apply via External Link" : "Apply for this Job"}
                </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {position.isExternal
                  ? "Your details will be shared with the employer, then you'll be redirected."
                  : "Fill in your details below. The recruiter will contact you."}
              </p>

              {position.salaryRange?.min && (
                <div className="mt-4 rounded-xl bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: position.salaryRange.currency || "INR",
                        maximumFractionDigits: 0,
                      }).format(position.salaryRange.min)}
                      {position.salaryRange.max
                        ? ` - ${new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: position.salaryRange.currency || "INR",
                            maximumFractionDigits: 0,
                          }).format(position.salaryRange.max)}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workExperience">Work Experience</Label>
                  <Textarea
                    id="workExperience"
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    placeholder="Briefly describe your relevant experience..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resume / CV</Label>
                  {resumeUrl ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {resumeFileName}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-3 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      <span>
                        {resumeUploading
                          ? "Uploading..."
                          : "Upload PDF, DOC, DOCX, or TXT"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        className="hidden"
                        onChange={handleResumeSelect}
                        disabled={resumeUploading}
                      />
                    </label>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border"
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms" className="underline underline-offset-2">
                      terms and conditions
                    </a>{" "}
                    and consent to my data being shared with the employer.{" "}
                    <span className="text-destructive">*</span>
                  </span>
                </label>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : position.isExternal ? (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Apply & Continue
                    </>
                  ) : hasApplicationForm ? (
                    "Continue"
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>

              {session?.user?.id && (
                <div className="mt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or quick apply with your profile
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={directApplying}
                  >
                    {directApplying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                    Direct Apply
                  </Button>
                </div>
              )}

              <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {position.applicationForm?.title || "Application form"}
                    </DialogTitle>
                    <DialogDescription>
                      {position.applicationForm?.description ||
                        "Tell us a bit more about yourself."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {position.applicationForm?.fields?.map((field) => {
                      const value = applicationValues[field.id] || ""

                      return (
                        <div
                          key={field.id}
                          className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4"
                        >
                          <Label
                            htmlFor={`af-${field.id}`}
                            className="text-sm font-medium"
                          >
                            {field.label || "Untitled question"}
                            {field.required ? " *" : ""}
                          </Label>

                          {field.type === "long-text" ? (
                            <Textarea
                              id={`af-${field.id}`}
                              value={value}
                              placeholder={field.placeholder}
                              rows={4}
                              required={field.required}
                              onChange={(e) =>
                                setApplicationValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                            />
                          ) : field.type === "select" ? (
                            <Select
                              value={value}
                              onValueChange={(v) =>
                                setApplicationValues((prev) => ({
                                  ...prev,
                                  [field.id]: v,
                                }))
                              }
                            >
                              <SelectTrigger id={`af-${field.id}`}>
                                <SelectValue
                                  placeholder={
                                    field.placeholder || "Select an option"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options || []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`af-${field.id}`}
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
                              onChange={(e) =>
                                setApplicationValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <DialogFooter className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setFormDialogOpen(false)}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Application
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Apply with your profile?</DialogTitle>
                    <DialogDescription>
                      Your profile details (name, email, skills, experience)
                      will be shared with the employer as your application.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {directResumeUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {directResumeFileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDirectResumeUrl("")
                            setDirectResumeFileName("")
                            setDirectResumeFile(null)
                          }}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-3 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground">
                        <Upload className="h-4 w-4" />
                        <span>
                          {directResumeUploading
                            ? "Uploading..."
                            : "Add Resume/CV (optional)"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          className="hidden"
                          onChange={handleDirectResumeSelect}
                          disabled={directResumeUploading}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleDirectApply} disabled={directResumeUploading}>
                      <Heart className="mr-2 h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>)}
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create an account to track your application</DialogTitle>
            <DialogDescription>
              Sign up to see when the recruiter views your profile, send
              messages, and get matched instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                window.location.href = "/signup"
              }}
            >
              Create Account
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSignupPrompt(false)}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
