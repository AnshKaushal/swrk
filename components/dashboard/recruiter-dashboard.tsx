"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MessageCircle,
  TrendingUp,
  Users,
  Zap,
  Clock,
  AlertCircle,
  BarChart3,
  Target,
} from "lucide-react"

interface MatchData {
  _id: string
  employer: { name: string; avatar: string }
  employee: { name: string; avatar: string }
  matchedAt: string
}

interface StatsData {
  likesGiven: number
  likesReceived: number
  matchesCount: number
  recentMatches: MatchData[]
  avgTimeToHire?: number
  candidateResponseRate?: number
}

interface RecruiterMetrics {
  avgTimeToHire?: number
  avgInterviews?: number
  acceptanceRate?: number
  costPerHire?: number
  openPositions?: number
  inProgress?: number
  offersExtended?: number
}

interface InterviewData {
  _id: string
  title: string
  scheduledFor: string
  employee: { name: string; avatar: string }
  candidate: { name: string; avatar: string }
  status: string
  duration: number
}

type ActivityPoint = { day: string; value: number }

export function RecruiterDashboard({ name }: { name: string }) {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ActivityPoint[]>([])
  const [range, setRange] = useState<number>(7)
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewData[]>(
    [],
  )
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [recruiterMetrics, setRecruiterMetrics] =
    useState<RecruiterMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/swipe/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const response = await fetch("/api/interviews?status=scheduled")
        if (response.ok) {
          const data = await response.json()
          const now = new Date()
          const futureInterviews = (data.interviews || []).filter(
            (interview: InterviewData) => {
              return new Date(interview.scheduledFor) > now
            },
          )
          setUpcomingInterviews(futureInterviews.slice(0, 3))
        }
      } catch (error) {
        console.error("Failed to fetch interviews:", error)
      } finally {
        setInterviewsLoading(false)
      }
    }

    fetchInterviews()
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchActivity = async () => {
      try {
        const res = await fetch(
          `/api/swipe/activity?range=${range}&type=received`,
        )
        if (!res.ok) return
        const json = await res.json()
        if (!mounted) return
        const mapped: ActivityPoint[] = json.data.map((p: any) => {
          const d = new Date(p.day)
          const label = d
            .toLocaleDateString(undefined, { weekday: "short" })
            .toUpperCase()
          return { day: label, value: p.value }
        })
        setChartData(mapped)
      } catch (err) {
        console.error("Failed to fetch activity:", err)
      }
    }

    fetchActivity()
    return () => {
      mounted = false
    }
  }, [range])

  useEffect(() => {
    const fetchRecruiterMetrics = async () => {
      try {
        const response = await fetch("/api/profile/me")
        if (response.ok) {
          const data = await response.json()
          setRecruiterMetrics({
            avgTimeToHire: data.avgTimeToHire,
            avgInterviews: data.avgInterviews,
            acceptanceRate: data.acceptanceRate,
            costPerHire: data.costPerHire,
            openPositions: data.openPositions || 0,
            inProgress: data.inProgress || 0,
            offersExtended: data.offersExtended || 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch recruiter metrics:", error)
      } finally {
        setMetricsLoading(false)
      }
    }

    fetchRecruiterMetrics()
  }, [])

  const metrics = [
    {
      label: "Candidates Reviewed",
      value: stats?.likesGiven || 0,
      trend: "+14%",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Applications Received",
      value: stats?.likesReceived || 0,
      trend: "+8%",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Candidate Response Rate",
      value:
        stats?.likesReceived && stats?.likesGiven
          ? Math.round((stats.likesReceived / stats.likesGiven) * 100)
          : 0,
      trend:
        stats?.likesReceived && stats?.likesGiven
          ? `${Math.round((stats.likesReceived / stats.likesGiven) * 100)}%`
          : "0%",
      suffix: "%",
      icon: TrendingUp,
      color: "bg-pink-100 text-pink-700",
    },
    {
      label: "Active Positions",
      value: stats?.matchesCount || 0,
      trend: "+5%",
      icon: Target,
      color: "bg-orange-100 text-orange-700",
    },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <main className="max-w-[1600px]">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s your hiring overview for today.
          </p>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <Card
                key={idx}
                className="border border-border/50 bg-card hover:shadow-md transition-shadow"
              >
                <CardContent>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${metric.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge
                      variant={
                        metric.trend === "Busy" || metric.trend === "Goal"
                          ? "secondary"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {metric.trend}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-2">
                    {metric.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {metric.value.toLocaleString()}
                    {metric.suffix ? metric.suffix : ""}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Application Activity</CardTitle>
              <select
                value={range}
                onChange={(e) => setRange(parseInt(e.target.value, 10))}
                className="text-sm border border-border rounded-md bg-background px-3 py-1"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Matches
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : stats?.recentMatches && stats.recentMatches.length > 0 ? (
                  stats.recentMatches.slice(0, 3).map((match) => {
                    const candidate = match.employee.name || match.employer.name
                    const avatar =
                      match.employee.avatar || match.employer.avatar
                    return (
                      <div
                        key={match._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <img
                          src={avatar || "/default-avatar.png"}
                          alt={candidate}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {candidate}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new Date(match.matchedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/messages/${match._id}`)
                          }
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No matches yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interviewsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview) => {
                  const candidateName =
                    interview.employee?.name ||
                    interview.candidate?.name ||
                    "Candidate"
                  const avatar =
                    interview.employee?.avatar || interview.candidate?.avatar
                  const scheduledDate = new Date(interview.scheduledFor)
                  const dateStr = scheduledDate.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                  const timeStr = scheduledDate.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  return (
                    <div
                      key={interview._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <img
                        src={avatar || "/default-avatar.png"}
                        alt={candidateName}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{interview.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {candidateName} • {dateStr}, {timeStr}
                        </p>
                      </div>
                      <Badge className="text-xs">PREPARE</Badge>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming interviews
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 relative overflow-hidden">
            <CardContent className="relative z-10">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                    <h3 className="text-xl md:text-2xl font-bold">
                      Find Your Next Star
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Swipe through potential candidates and discover your next
                    great hire with Swrk™
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard/swipe")}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Zap className="w-4 h-4" />
                  See Candidates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Hiring Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Open Positions</span>
                    <span className="text-sm font-semibold">
                      {recruiterMetrics?.openPositions || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: recruiterMetrics?.openPositions
                          ? Math.min(recruiterMetrics.openPositions * 10, 100) +
                            "%"
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">In Progress</span>
                    <span className="text-sm font-semibold">
                      {recruiterMetrics?.inProgress || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: recruiterMetrics?.inProgress
                          ? Math.min(recruiterMetrics.inProgress * 10, 100) +
                            "%"
                          : "0%",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Offers Extended</span>
                    <span className="text-sm font-semibold">
                      {recruiterMetrics?.offersExtended || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: recruiterMetrics?.offersExtended
                          ? Math.min(
                              recruiterMetrics.offersExtended * 10,
                              100,
                            ) + "%"
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                Recruitment Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Time to Hire
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${recruiterMetrics?.avgTimeToHire || "N/A"}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Interviews
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${recruiterMetrics?.avgInterviews || "N/A"}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Acceptance Rate
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${recruiterMetrics?.acceptanceRate || "N/A"}%`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Cost Per Hire
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${recruiterMetrics?.costPerHire ? "$" + recruiterMetrics.costPerHire : "N/A"}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Hiring Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats &&
                stats.matchesCount > 0 &&
                (recruiterMetrics?.acceptanceRate || 0) < 85 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Expand Candidate Pool
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                      Your acceptance rate is{" "}
                      {recruiterMetrics?.acceptanceRate || 0}%. Broaden your
                      criteria to improve hiring success.
                    </p>
                  </div>
                )}
              {recruiterMetrics?.avgTimeToHire &&
                recruiterMetrics.avgTimeToHire > 14 && (
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Speed Up Hiring
                    </p>
                    <p className="text-xs text-purple-800 dark:text-purple-200 mt-1">
                      Your average time-to-hire is{" "}
                      {recruiterMetrics.avgTimeToHire} days. Batch interview
                      scheduling can help reduce this.
                    </p>
                  </div>
                )}
              {stats && stats.likesReceived > 0 && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Quality Focus
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                    Your response rate is strong. Continue personalized outreach
                    to top candidates.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
