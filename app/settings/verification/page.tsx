"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function VerificationSettings() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState<"identity" | "company">("identity")
  const [fullName, setFullName] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyWebsite, setCompanyWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [documents, setDocuments] = useState<File[]>([])
  const [request, setRequest] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin")
    if (status === "authenticated") fetchCurrent()
  }, [status, router])

  const fetchCurrent = async () => {
    setLoading(true)
    try {
      const [profileResponse, requestResponse] = await Promise.all([
        fetch("/api/profile/me"),
        fetch("/api/verification/my"),
      ])

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        const userData = profileData.user ?? {}
        const employerProfile = profileData.employerProfile ?? {}

        setFullName(userData.name || "")
        setLinkedinUrl(userData.linkedinUrl || "")
        setCompanyName(employerProfile.companyName || "")
        setCompanyWebsite(employerProfile.companyWebsite || "")
      }

      if (requestResponse.ok) {
        const data = await requestResponse.json()
        const currentRequest = data.request ?? null
        setRequest(currentRequest)

        if (currentRequest) {
          setType(currentRequest.type || "identity")
          setFullName(currentRequest.fullName || "")
          setLinkedinUrl(currentRequest.linkedinUrl || "")
          setCompanyName(currentRequest.companyName || "")
          setCompanyWebsite(currentRequest.companyWebsite || "")
          setDescription(currentRequest.description || "")
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("type", type)
      fd.append("fullName", fullName)
      fd.append("linkedinUrl", linkedinUrl)
      fd.append("companyName", companyName)
      fd.append("companyWebsite", companyWebsite)
      fd.append("description", description)
      for (const document of documents) {
        fd.append("documents", document)
      }

      const res = await fetch("/api/verification/submit", {
        method: "POST",
        body: fd,
      })
      if (res.ok) {
        toast.success("Verification submitted")
        setDescription("")
        setDocuments([])
        await fetchCurrent()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to submit")
      }
    } catch (err) {
      toast.error("Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-border">
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Profile Verification</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Submit documents for profile verification. Employers can submit
            company documents; employees can submit identity proofs. Admin will
            review.
          </p>
        </div>

        <div className="md:col-span-2 space-y-6">
          {request ? (
            <div className="rounded-md border border-border p-4">
              <p className="font-medium">Current request</p>
              <p className="text-sm text-muted-foreground">
                Status: {request.status}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-medium text-foreground">Name:</span>{" "}
                  {request.fullName || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-foreground">LinkedIn:</span>{" "}
                  {request.linkedinUrl || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Company:</span>{" "}
                  {request.companyName || "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Website:</span>{" "}
                  {request.companyWebsite || "Not provided"}
                </p>
              </div>
              {request.documents && request.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Documents
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {request.documents.map((document: any) => (
                      <a
                        key={document.url}
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border px-3 py-2 text-sm text-primary underline"
                      >
                        {document.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-border p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2"
                  placeholder="Your legal name"
                />
              </div>
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="mt-2"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2"
                  placeholder="Company or employer name"
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="mt-2"
                  placeholder="https://company.com"
                />
              </div>
            </div>

            <div>
              <Label>Verification Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setType("identity")}
                  className={cn(
                    "px-3 py-1",
                    type === "identity" && "bg-primary! text-background!",
                  )}
                >
                  Identity
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setType("company")}
                  className={cn(
                    "px-3 py-1",
                    type === "company" && "bg-primary! text-background!",
                  )}
                >
                  Company
                </Button>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                className="mt-2"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description or notes for the reviewer"
              />
            </div>

            <div>
              <Label htmlFor="documents">Documents</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="mt-2"
                onChange={(e) =>
                  setDocuments(e.target.files ? Array.from(e.target.files) : [])
                }
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Upload ID cards, company registration docs, utility bills, or
                other proof.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
