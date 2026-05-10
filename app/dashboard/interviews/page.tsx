"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { format, isPast } from "date-fns"
import { toast } from "sonner"
import { InterviewFeedbackDialog } from "@/components/interview-feedback-dialog"

interface Interview {
  _id: string
  title: string
  description: string
  scheduledFor: string
  timezone: string
  duration: number
  status: "scheduled" | "confirmed" | "denied" | "completed" | "cancelled"
  interviewLink: string
  employer: { _id: string; name: string; avatar: string; companyName?: string }
  employee: { _id: string; name: string; avatar: string; headline?: string }
  createdBy: string
  confirmedAt?: string
  deniedAt?: string
  deniedReason?: string
}

export default function InterviewsDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "confirmed" | "past"
  >("all")

  useEffect(() => {
    if (!session?.user) return

    const fetchInterviews = async () => {
      try {
        const res = await fetch("/api/interviews")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setInterviews(data.interviews)
      } catch (error) {
        console.error("Error fetching interviews:", error)
        toast.error("Failed to load interviews")
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()

    const handleUpdate = () => {
      fetchInterviews()
    }

    window.addEventListener("swrk:interviews-updated", handleUpdate)
    window.addEventListener("focus", handleUpdate)

    return () => {
      window.removeEventListener("swrk:interviews-updated", handleUpdate)
      window.removeEventListener("focus", handleUpdate)
    }
  }, [session])

  const getFilteredInterviews = () => {
    const now = new Date()

    return interviews.filter((interview) => {
      const scheduledDate = new Date(interview.scheduledFor)

      switch (filter) {
        case "upcoming":
          return (
            scheduledDate > now &&
            interview.status === "scheduled" &&
            !isPast(scheduledDate)
          )
        case "confirmed":
          return interview.status === "confirmed"
        case "past":
          return scheduledDate < now || interview.status === "completed"
        default:
          return true
      }
    })
  }

  const handleConfirm = async (interviewId: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      })

      if (!res.ok) throw new Error("Failed to confirm")

      const data = await res.json()
      setInterviews((prev) =>
        prev.map((i) => (i._id === interviewId ? data.interview : i)),
      )
      toast.success("Interview confirmed!")
    } catch (error) {
      console.error("Error confirming interview:", error)
      toast.error("Failed to confirm interview")
    }
  }

  const handleDeny = async (interviewId: string, reason: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "denied", reason }),
      })

      if (!res.ok) throw new Error("Failed to deny")

      const data = await res.json()
      setInterviews((prev) =>
        prev.map((i) => (i._id === interviewId ? data.interview : i)),
      )
      toast.success("Interview declined")
    } catch (error) {
      console.error("Error denying interview:", error)
      toast.error("Failed to decline interview")
    }
  }

  const handleAddToCalendar = (interview: Interview) => {
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

  const handleOpenMeet = (interviewLink: string) => {
    window.open(interviewLink, "_blank", "noopener,noreferrer")
  }

  const filteredInterviews = getFilteredInterviews().sort(
    (a, b) =>
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  )

  const getStatusBadge = (interview: Interview) => {
    switch (interview.status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "denied":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending Response
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            {interview.status}
          </Badge>
        )
    }
  }

  const isEmployer = (interview: Interview) =>
    interview.employer._id === session?.user?.id

  const otherParty = (interview: Interview) =>
    isEmployer(interview) ? interview.employee : interview.employer

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Interviews</h1>
          <p className="text-muted-foreground">
            Manage and schedule your interviews
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "upcoming", "confirmed", "past"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() =>
                setFilter(f as "all" | "upcoming" | "confirmed" | "past")
              }
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {filteredInterviews.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Video className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No interviews yet</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "You don't have any scheduled interviews"
                  : `No ${filter} interviews`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInterviews.map((interview) => {
              const scheduledDate = new Date(interview.scheduledFor)
              const isPastInterview = isPast(scheduledDate)

              return (
                <Card
                  key={interview._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-primary mb-1">
                              {interview.title}
                            </h3>
                            <p className="text-muted-foreground">
                              {interview.description}
                            </p>
                          </div>
                          {getStatusBadge(interview)}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>
                              {format(scheduledDate, "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>
                              {format(scheduledDate, "h:mm a")} (
                              {interview.timezone}) • {interview.duration} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            <span>
                              With <strong>{otherParty(interview).name}</strong>
                              {isEmployer(interview) &&
                                interview.employee.headline && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    • {interview.employee.headline}
                                  </span>
                                )}
                              {!isEmployer(interview) &&
                                interview.employer.companyName && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    • {interview.employer.companyName}
                                  </span>
                                )}
                            </span>
                          </div>
                        </div>

                        {interview.deniedReason && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                            <p className="text-sm text-red-800">
                              <strong>Decline reason:</strong>{" "}
                              {interview.deniedReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 min-w-fit">
                        {interview.status === "scheduled" &&
                          !isEmployer(interview) &&
                          !isPastInterview && (
                            <>
                              <Button
                                onClick={() => handleConfirm(interview._id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const reason = prompt(
                                    "Enter reason for declining:",
                                  )
                                  if (reason !== null)
                                    handleDeny(interview._id, reason)
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                                Decline
                              </Button>
                            </>
                          )}

                        {(interview.status === "confirmed" ||
                          interview.status === "scheduled" ||
                          isPastInterview) && (
                          <>
                            <Button
                              onClick={() =>
                                handleOpenMeet(interview.interviewLink)
                              }
                              variant="default"
                            >
                              <Video className="w-4 h-4" />
                              Join Google Meet
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAddToCalendar(interview)}
                            >
                              <Calendar className="w-4 h-4" />
                              Add to Calendar
                            </Button>
                            {(interview.status === "completed" ||
                              isPastInterview) && (
                              <InterviewFeedbackDialog
                                interview={interview}
                                currentUserId={session?.user?.id || ""}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
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
