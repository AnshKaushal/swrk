"use client"
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Video,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  Copy,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { InterviewFeedbackDialog } from "@/components/interview-feedback-dialog"

interface InterviewMessage {
  _id: string
  title: string
  description: string
  scheduledFor: string
  timezone: string
  duration: number
  status: "scheduled" | "confirmed" | "denied" | "completed" | "cancelled"
  interviewLink: string
  createdBy: string
  employer: { _id: string; name: string; companyName?: string }
  employee: { _id: string; name: string; headline?: string }
  deniedReason?: string
  confirmedAt?: string
  deniedAt?: string
}

interface InterviewMessageComponentProps {
  interview: InterviewMessage
  currentUserId: string
  messageSenderId?: string
  messageSender?: { name?: string; avatar?: string }
  messageCreatedAt?: string
  messageKind?: "scheduled" | "response"
  onStatusChange?: (interviewId: string, status: string) => void
}

export function InterviewMessageComponent({
  interview,
  currentUserId,
  messageSenderId,
  messageSender,
  messageCreatedAt,
  messageKind = "scheduled",
  onStatusChange,
}: InterviewMessageComponentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState<InterviewMessage["status"]>(
    interview.status,
  )
  const [openDeny, setOpenDeny] = useState(false)
  const [denyReason, setDenyReason] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLocalStatus(interview.status)
  }, [interview.status])

  const isEmployee = currentUserId === interview.employee._id
  const canRespond =
    isEmployee && localStatus === "scheduled" && messageKind === "scheduled"

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
      setLocalStatus("confirmed")
      onStatusChange?.(interview._id, "confirmed")
    } catch (error) {
      console.error("Error confirming interview:", error)
      toast.error("Failed to confirm interview")
    } finally {
      setIsLoading(false)
    }
  }

  const submitDeny = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/interviews/${interview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied", reason: denyReason }),
      })

      if (!res.ok) throw new Error("Failed to deny")

      toast.success("Interview declined")
      setLocalStatus("denied")
      onStatusChange?.(interview._id, "denied")
      setOpenDeny(false)
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(interview.interviewLink)
      setCopied(true)
      toast.success("Google Meet link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
      toast.error("Failed to copy link")
    }
  }

  const scheduledDate = new Date(interview.scheduledFor)
  const interviewEnded =
    localStatus === "completed" || scheduledDate.getTime() <= Date.now()
  const messageDate = new Date(
    messageCreatedAt ||
      interview.confirmedAt ||
      interview.deniedAt ||
      interview.scheduledFor,
  )
  const isFromCurrentUser = messageSenderId
    ? messageSenderId === currentUserId
    : currentUserId === interview.employee._id
  const responderName = isFromCurrentUser
    ? "You"
    : messageSender?.name ||
      (messageSenderId === interview.employee._id
        ? interview.employee.name
        : interview.employer.companyName || interview.employer.name)

  const statusStyles: Record<
    InterviewMessage["status"],
    { card: string; badge: string }
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
    cancelled: {
      card: "border-border bg-muted/40",
      badge: "bg-muted text-muted-foreground border border-border",
    },
  }

  const currentStatus = statusStyles[localStatus]

  if (messageKind === "scheduled" && localStatus === "scheduled") {
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
              Pending Response
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

                <AlertDialog open={openDeny} onOpenChange={setOpenDeny}>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Decline Interview</AlertDialogTitle>
                      <AlertDialogDescription>
                        Provide an optional reason for declining this interview.
                        This will be sent to the other party.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-2">
                      <Textarea
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                        placeholder="Optional reason"
                        rows={4}
                      />
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setOpenDeny(false)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={submitDeny}>
                        Decline Interview
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <Button
              onClick={handleOpenMeet}
              variant="default"
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              Join Google Meet
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              onClick={handleAddToCalendar}
              variant="outline"
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={cn(
        "flex max-w-[82%] items-end gap-2",
        isFromCurrentUser ? "ml-auto flex-row-reverse" : "",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 border border-border">
        <AvatarImage src={messageSender?.avatar} alt={responderName} />
        <AvatarFallback>
          {responderName
            .split(" ")
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("")}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "space-y-1",
          isFromCurrentUser ? "items-end text-right" : "",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            currentStatus.card,
            isFromCurrentUser ? "rounded-br-sm" : "rounded-bl-sm",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{responderName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {localStatus === "confirmed"
                  ? "Confirmed the interview"
                  : localStatus === "denied"
                    ? "Declined the interview"
                    : localStatus === "cancelled"
                      ? "Cancelled the interview"
                      : "Completed the interview"}
              </p>
            </div>

            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-medium whitespace-nowrap",
                currentStatus.badge,
              )}
            >
              {localStatus === "confirmed"
                ? "Confirmed"
                : localStatus === "denied"
                  ? "Declined"
                  : localStatus === "cancelled"
                    ? "Cancelled"
                    : "Completed"}
            </span>
          </div>

          {localStatus === "denied" &&
            (denyReason || interview.deniedReason) && (
              <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-sm text-foreground dark:bg-white/5">
                {denyReason || interview.deniedReason}
              </p>
            )}

          {!interviewEnded &&
            (localStatus === "confirmed" || localStatus === "scheduled") && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={handleOpenMeet}
                  size="sm"
                  variant="default"
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Join Meet
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAddToCalendar}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            )}

          {interviewEnded && (
            <div className="mt-3 flex flex-wrap gap-2">
              <InterviewFeedbackDialog
                interview={interview}
                currentUserId={currentUserId}
              />
            </div>
          )}

          <div
            className={cn(
              "mt-2 flex items-center gap-1 px-1 text-[10px] text-muted-foreground",
              isFromCurrentUser ? "justify-end" : "",
            )}
          >
            <span>{format(messageDate, "h:mm a")}</span>
          </div>
        </div>
      </div>
    </div>
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
