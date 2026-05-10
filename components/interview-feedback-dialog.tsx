"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Star } from "lucide-react"
import { toast } from "sonner"

type InterviewFeedbackDialogProps = {
  interview: {
    _id: string
    title: string
    scheduledFor: string
    status: string
    employer: { _id: string; name: string; companyName?: string }
    employee: { _id: string; name: string; headline?: string }
  }
  currentUserId: string
}

type RatingField =
  | "responsiveness"
  | "communication"
  | "professionalism"
  | "punctuality"
  | "overall"

const ratingLabels: Record<RatingField, string> = {
  responsiveness: "Responsiveness",
  communication: "Communication",
  professionalism: "Professionalism",
  punctuality: "Punctuality",
  overall: "Overall",
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }, (_, index) => index + 1).map((score) => (
        <Button
          key={score}
          type="button"
          variant={value === score ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(score)}
          className="min-w-10"
        >
          <Star className="mr-1 h-3 w-3" />
          {score}
        </Button>
      ))}
    </div>
  )
}

export function InterviewFeedbackDialog({
  interview,
  currentUserId,
}: InterviewFeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<any>(null)
  const [canSubmit, setCanSubmit] = useState(false)
  const [formData, setFormData] = useState({
    responsiveness: 3,
    communication: 3,
    professionalism: 3,
    punctuality: 3,
    overall: 3,
    wouldWorkAgain: true,
    notes: "",
  })

  const isEmployer = interview.employer._id === currentUserId
  const targetName = isEmployer
    ? interview.employee.name
    : interview.employer.companyName || interview.employer.name
  const roleTitle = isEmployer ? "employee" : "company"
  const promptTitle = isEmployer
    ? "Evaluate the candidate"
    : "Evaluate the interview experience"

  const canOpen = useMemo(() => {
    const scheduledDate = new Date(interview.scheduledFor)
    return (
      interview.status === "completed" || scheduledDate.getTime() <= Date.now()
    )
  }, [interview.scheduledFor, interview.status])

  useEffect(() => {
    if (!open) return

    const loadFeedback = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/interviews/${interview._id}/feedback`, {
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load feedback")
        }

        setExistingFeedback(json.existingFeedback || null)
        setCanSubmit(Boolean(json.canSubmit))
        if (json.existingFeedback?.ratings) {
          setFormData({
            responsiveness: json.existingFeedback.ratings.responsiveness || 3,
            communication: json.existingFeedback.ratings.communication || 3,
            professionalism: json.existingFeedback.ratings.professionalism || 3,
            punctuality: json.existingFeedback.ratings.punctuality || 3,
            overall: json.existingFeedback.ratings.overall || 3,
            wouldWorkAgain: Boolean(json.existingFeedback.wouldWorkAgain),
            notes: json.existingFeedback.notes || "",
          })
        }
      } catch (error) {
        console.error(error)
        toast.error("Failed to load feedback form")
      } finally {
        setLoading(false)
      }
    }

    void loadFeedback()
  }, [interview._id, open])

  const updateRating = (field: RatingField, value: number) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await fetch(`/api/interviews/${interview._id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Failed to submit feedback")
      }

      setExistingFeedback(json.feedback)
      try {
        window.dispatchEvent(new Event("swrk:interviews-updated"))
      } catch {
        // ignore
      }
      toast.success("Feedback submitted")
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={!canOpen}
      >
        {existingFeedback ? "Edit feedback" : "Leave feedback"}
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{promptTitle}</DialogTitle>
          <DialogDescription>
            Share your feedback on {targetName} after the interview.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading questionnaire...
          </div>
        ) : (
          <div className="space-y-5">
            {!canSubmit ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Feedback opens after the interview time.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{interview.title}</Badge>
              <Badge variant="outline">{roleTitle}</Badge>
              {existingFeedback ? <Badge>Already submitted</Badge> : null}
            </div>

            {(
              [
                "responsiveness",
                "communication",
                "professionalism",
                "punctuality",
                "overall",
              ] as RatingField[]
            ).map((field) => (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-foreground">
                    {ratingLabels[field]}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    1 = low, 5 = high
                  </span>
                </div>
                <RatingPicker
                  value={formData[field]}
                  onChange={(value) => updateRating(field, value)}
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Would you work with {targetName} again?
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.wouldWorkAgain ? "default" : "outline"}
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      wouldWorkAgain: true,
                    }))
                  }
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!formData.wouldWorkAgain ? "default" : "outline"}
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      wouldWorkAgain: false,
                    }))
                  }
                >
                  No
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Additional notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
                placeholder="Share what went well or what could improve..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !canSubmit}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit feedback
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
