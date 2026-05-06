"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface InterviewMessage {
  _id: string
  title: string
  description: string
  scheduledFor: string
  timezone: string
  duration: number
  status: "scheduled" | "confirmed" | "denied" | "completed"
  interviewLink: string
  createdBy: string
  employer: { _id: string; name: string; companyName?: string }
  employee: { _id: string; name: string; headline?: string }
}

interface InterviewMessageComponentProps {
  interview: InterviewMessage
  currentUserId: string
  onStatusChange?: (interviewId: string, status: string) => void
}

export function InterviewMessageComponent({
  interview,
  currentUserId,
  onStatusChange,
}: InterviewMessageComponentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEmployee = currentUserId === interview.employee._id
  const isScheduled = interview.status === "scheduled"
  const canRespond = isEmployee && isScheduled

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/interviews/${interview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })

      if (!res.ok) throw new Error("Failed to confirm")

      toast.success("Interview confirmed!")
      onStatusChange?.(interview._id, "confirmed")
    } catch (error) {
      console.error("Error confirming interview:", error)
      toast.error("Failed to confirm interview")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeny = async () => {
    const reason = prompt("Enter reason for declining (optional):")
    if (reason === null) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/interviews/${interview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied", reason }),
      })

      if (!res.ok) throw new Error("Failed to deny")

      toast.success("Interview declined")
      onStatusChange?.(interview._id, "denied")
    } catch (error) {
      console.error("Error denying interview:", error)
      toast.error("Failed to decline interview")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCalendar = () => {
    const startDate = new Date(interview.scheduledFor)
    const endDate = new Date(startDate.getTime() + interview.duration * 60000)

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SWRK//Interview Calendar//EN
BEGIN:VEVENT
UID:${interview._id}@swrk.com
DTSTAMP:${formatICS(new Date())}
DTSTART:${formatICS(startDate)}
DTEND:${formatICS(endDate)}
SUMMARY:${interview.title}
DESCRIPTION:${interview.description || "Interview"}
LOCATION:${interview.interviewLink}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `interview-${interview._id}.ics`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Calendar file downloaded")
  }

  const handleOpenMeet = () => {
    window.open(interview.interviewLink, "_blank", "noopener,noreferrer")
  }

  const scheduledDate = new Date(interview.scheduledFor)
  const statusColors: Record<string, string> = {
    scheduled: "border-blue-200 bg-blue-50",
    confirmed: "border-green-200 bg-green-50",
    denied: "border-red-200 bg-red-50",
    completed: "border-gray-200 bg-gray-50",
  }

  return (
    <Card className={`border-2 ${statusColors[interview.status]}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{interview.title}</CardTitle>
            {interview.description && (
              <p className="text-sm text-slate-600 mt-1">
                {interview.description}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              interview.status === "confirmed"
                ? "bg-green-200 text-green-800"
                : interview.status === "denied"
                  ? "bg-red-200 text-red-800"
                  : "bg-blue-200 text-blue-800"
            }`}
          >
            {interview.status === "scheduled"
              ? "Pending Response"
              : interview.status.charAt(0).toUpperCase() +
                interview.status.slice(1)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm">
                {format(scheduledDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm">
                {format(scheduledDate, "h:mm a")} ({interview.timezone}) •{" "}
                {interview.duration} min
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">
                With{" "}
                {currentUserId === interview.employee._id
                  ? interview.employer.companyName || interview.employer.name
                  : interview.employee.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canRespond ? (
            <>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Interview
              </Button>
              <Button
                onClick={handleDeny}
                disabled={isLoading}
                variant="outline"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </Button>
            </>
          ) : null}

          {(interview.status === "confirmed" ||
            interview.status === "scheduled") && (
            <>
              <Button onClick={handleOpenMeet} variant="default">
                <Video className="w-4 h-4" />
                Join Google Meet
              </Button>
              <Button onClick={handleAddToCalendar} variant="outline">
                <Calendar className="w-4 h-4" />
                Add to Calendar
              </Button>
            </>
          )}
        </div>

        {interview.status === "denied" && (
          <div className="bg-red-100 border border-red-200 rounded p-2 text-sm text-red-800">
            This interview has been declined
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatICS(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}
