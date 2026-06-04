"use client"

import { useState } from "react"
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
} from "@/components/ui/dialog"
import { Markdown } from "@/components/ui/markdown"
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  ExternalLink,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

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
  employerId: {
    _id: string
    name?: string
    avatar?: string
    companyName?: string
  }
}

export function PublicJobView({ position }: { position: PublicPosition }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [location, setLocation] = useState("")
  const [workExperience, setWorkExperience] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
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
