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
import { cn } from "@/lib/utils"

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
    const timeZone = interview.timezone || "UTC"
    const startDate = new Date(interview.scheduledFor)
    const endDate = new Date(startDate.getTime() + interview.duration * 60000)

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SWRK//Interview Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-TIMEZONE:${timeZone}
BEGIN:VEVENT
UID:${interview._id}@swrk.com
DTSTAMP:${formatICSUTC(new Date())}
DTSTART;TZID=${timeZone}:${formatICSDateTime(startDate, timeZone)}
DTEND;TZID=${timeZone}:${formatICSDateTime(endDate, timeZone)}
SUMMARY:${escapeICSValue(interview.title)}
DESCRIPTION:${escapeICSValue(interview.description || "Interview")}
LOCATION:${escapeICSValue(interview.interviewLink)}
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

  const statusStyles: Record<
    InterviewMessage["status"],
    {
      card: string
      badge: string
    }
  > = {
    scheduled: {
      card: "border-border bg-card",
      badge: "bg-secondary text-secondary-foreground border border-border",
    },
    confirmed: {
      card: "border-green-500/30 bg-green-500/5 dark:bg-green-500/10",
      badge:
        "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/20",
    },
    denied: {
      card: "border-red-500/30 bg-red-500/5 dark:bg-red-500/10",
      badge:
        "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    completed: {
      card: "border-border bg-muted/40",
      badge: "bg-muted text-muted-foreground border border-border",
    },
  }

  const currentStatus = statusStyles[interview.status]

  return (
    <Card className={cn("border-2 transition-colors", currentStatus.card)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{interview.title}</CardTitle>

            {interview.description && (
              <p className="text-sm text-muted-foreground">
                {interview.description}
              </p>
            )}
          </div>

          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
              currentStatus.badge,
            )}
          >
            {interview.status === "scheduled"
              ? "Pending Response"
              : interview.status.charAt(0).toUpperCase() +
                interview.status.slice(1)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />

              <span className="text-sm text-foreground">
                {format(scheduledDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />

              <span className="text-sm text-foreground">
                {format(scheduledDate, "h:mm a")} ({interview.timezone}) •{" "}
                {interview.duration} min
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />

              <span className="text-sm font-medium text-foreground">
                With{" "}
                {currentUserId === interview.employee._id
                  ? interview.employer.companyName || interview.employer.name
                  : interview.employee.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canRespond && (
            <>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Interview
              </Button>

              <Button
                onClick={handleDeny}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
            </>
          )}

          {(interview.status === "confirmed" ||
            interview.status === "scheduled") && (
            <>
              <Button
                onClick={handleOpenMeet}
                variant="default"
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Join Google Meet
              </Button>

              <Button
                onClick={handleAddToCalendar}
                variant="outline"
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </Button>
            </>
          )}
        </div>

        {interview.status === "denied" && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            This interview has been declined
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatICSDateTime(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date)

    const values = parts.reduce<Record<string, string>>((accumulator, part) => {
      accumulator[part.type] = part.value
      return accumulator
    }, {})

    return `${values.year}${values.month}${values.day}T${values.hour}${values.minute}${values.second}`
  } catch {
    return formatICSUTC(date)
  }
}

function formatICSUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

function escapeICSValue(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
}
