"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2, FileText, Star } from "lucide-react"
import { toast } from "sonner"

type ResumeItem = {
  _id: string
  title: string
  url: string
  fileName: string
  mimeType: string
  size: number
  isVisibleOnProfile: boolean
  isFeatured: boolean
  createdAt?: string
}

export default function ResumeSettingsPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes")
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error("Error fetching resumes:", error)
      toast.error("Failed to load resumes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchResumes()
    }
  }, [status])

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Choose a resume file first")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append(
        "title",
        title.trim() || selectedFile.name.replace(/\.[^.]+$/, ""),
      )

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to upload resume")
        return
      }

      setResumes((prev) => [data.resume, ...prev])
      setSelectedFile(null)
      setTitle("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      toast.success("Resume uploaded successfully")
    } catch (error) {
      console.error("Error uploading resume:", error)
      toast.error("Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to delete resume")
        return
      }

      setResumes((prev) => prev.filter((resume) => resume._id !== resumeId))
      toast.success("Resume deleted")
    } catch (error) {
      console.error("Error deleting resume:", error)
      toast.error("Failed to delete resume")
    }
  }

  const toggleResumeVisibility = (
    resumeId: string,
    isVisibleOnProfile: boolean,
  ) => {
    setResumes((prev) =>
      prev.map((resume) =>
        resume._id === resumeId ? { ...resume, isVisibleOnProfile } : resume,
      ),
    )
  }

  const setFeaturedResume = (resumeId: string) => {
    setResumes((prev) =>
      prev.map((resume) => ({
        ...resume,
        isFeatured: resume._id === resumeId,
        isVisibleOnProfile:
          resume._id === resumeId ? true : resume.isVisibleOnProfile,
      })),
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumes: resumes.map((resume) => ({
            id: resume._id,
            title: resume.title,
            isVisibleOnProfile: resume.isVisibleOnProfile,
            isFeatured: resume.isFeatured,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to save resumes")
        return
      }

      setResumes(data.resumes || resumes)
      toast.success("Resume settings updated")
    } catch (error) {
      console.error("Error saving resumes:", error)
      toast.error("Failed to save resumes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col divide-y divide-border">
      <div className="grid max-w-7xl flex-1 grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Resumes</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Upload, manage, and choose the resume that shows on your profile.
          </p>
        </div>

        <div className="md:col-span-2 space-y-6 rounded-xl border border-border p-4 h-fit">
          <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="resume-title">Resume Title</Label>
              <Input
                id="resume-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resume-file">Upload Resume</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="resume-file"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Resume
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, or DOCX. The first uploaded resume is set as your
                default visible resume.
              </p>
            </div>
          </div>

          {resumes.length > 0 ? (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="space-y-4 rounded-xl border border-border p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border border-border bg-muted p-3">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="text-base font-semibold">
                            {resume.title}
                          </Label>
                          {resume.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                              <Star className="h-3 w-3" />
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resume.fileName}
                        </p>
                        <a
                          href={resume.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Open file
                        </a>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(resume._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Resume Title</Label>
                      <Input
                        value={resume.title}
                        onChange={(e) =>
                          setResumes((prev) =>
                            prev.map((item) =>
                              item._id === resume._id
                                ? { ...item, title: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div>
                        <Label>Visible on profile</Label>
                        <p className="text-xs text-muted-foreground">
                          Let this resume appear on your public profile.
                        </p>
                      </div>
                      <Switch
                        checked={resume.isVisibleOnProfile}
                        onCheckedChange={(checked) =>
                          toggleResumeVisibility(resume._id, checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <Label>Visible resume</Label>
                      <p className="text-xs text-muted-foreground">
                        This is the resume your public profile will highlight.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={resume.isFeatured ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeaturedResume(resume._id)}
                    >
                      {resume.isFeatured
                        ? "Currently visible"
                        : "Set as visible"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold">
                No resumes uploaded
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your first resume to manage visibility and profile
                display.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex justify-start">
          <Button
            onClick={handleSave}
            disabled={saving || resumes.length === 0}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
