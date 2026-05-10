"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Loader2, Video } from "lucide-react"
import { toast } from "sonner"

interface ScheduleInterviewModalProps {
  matchId: string
  employeeName: string
  onInterviewScheduled?: () => void
}

export function ScheduleInterviewModal({
  matchId,
  employeeName,
  onInterviewScheduled,
}: ScheduleInterviewModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)
  const [existingInterview, setExistingInterview] = useState<any>(null)
  const [showExistingAlert, setShowExistingAlert] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledFor: "",
    timezone: "UTC",
    duration: 60,
  })

  const checkExistingInterview = async () => {
    setCheckingExisting(true)
    try {
      const res = await fetch(`/api/interviews?matchId=${matchId}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        const scheduled = data.interviews?.find(
          (i: any) => i.status === "scheduled" || i.status === "confirmed",
        )
        if (scheduled) {
          setExistingInterview(scheduled)
          setShowExistingAlert(true)
          return true
        }
      }
    } catch (error) {
      console.error("Error checking existing interview:", error)
    } finally {
      setCheckingExisting(false)
    }
    return false
  }

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      const exists = await checkExistingInterview()
      if (exists) {
        setIsOpen(false)
        return
      }
    }
    setIsOpen(open)
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value) : value,
    }))
  }

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.scheduledFor) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      // Convert datetime-local (local wall time) to an ISO string (UTC)
      const payload = {
        matchId,
        title: formData.title,
        description: formData.description,
        // datetime-local has no timezone info in the string; convert in-browser
        scheduledFor: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : "",
        timezone: formData.timezone,
        duration: formData.duration,
      }

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to schedule interview")
      }

      toast.success("Interview scheduled and message sent!")
      setIsOpen(false)
      setFormData({
        title: "",
        description: "",
        scheduledFor: "",
        timezone: "UTC",
        duration: 60,
      })
      onInterviewScheduled?.()
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule interview",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AlertDialog open={showExistingAlert} onOpenChange={setShowExistingAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interview Already Scheduled</AlertDialogTitle>
            <AlertDialogDescription>
              An interview is already scheduled with {employeeName}. You cannot
              schedule another interview for this match until the current one is
              completed or cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Status:</strong>{" "}
              {existingInterview?.status
                ? existingInterview.status.charAt(0).toUpperCase() +
                  existingInterview.status.slice(1)
                : "Scheduled"}
            </p>
            {existingInterview?.scheduledFor && (
              <p className="text-sm">
                <strong>Scheduled:</strong>{" "}
                {new Date(existingInterview.scheduledFor).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Close</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="sm:w-fit">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Interview</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule an Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {employeeName}. They will receive a
              notification and can confirm or decline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSchedule} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Technical Round, HR Round"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., Technical assessment with backend focus"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Date & Time</Label>
                <Input
                  id="scheduledFor"
                  name="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={formData.duration}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Anchorage">Alaska (AKT)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Europe/London">GMT</option>
                <option value="Europe/Paris">
                  Central European Time (CET)
                </option>
                <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                <option value="Australia/Sydney">
                  Australian Eastern Time (AEDT)
                </option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> A Google Meet link will be automatically
                generated and shared with the candidate.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Schedule Interview
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
