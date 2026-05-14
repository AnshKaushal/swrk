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
  Heart,
  MessageCircle,
  Eye,
  CheckCircle2,
  Zap,
  Building2,
  Calendar,
  Briefcase,
  Flame,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react"

interface MatchData {
  _id: string
  employer: { name: string; avatar: string; companyName: string }
  employee: { name: string; avatar: string }
  matchedAt: string
}

interface StatsData {
  likesGiven: number
  likesReceived: number
  matchesCount: number
  recentMatches: MatchData[]
  responseRate?: number
  lastActivityAt?: string
}

interface UserProfile {
  profileCompletion?: number
  resumeQuality?: number
  skillsMatchScore?: number
  avgResponseTime?: number
  currentStreak?: number
}

interface DashboardMetrics {
  avgResponseTime?: number
  completionRate?: number
  lastActivityDate?: string
}

interface InterviewData {
  _id: string
  title: string
  scheduledFor: string
  employer: { name: string; avatar: string; companyName: string }
  status: string
  duration: number
}

type ActivityPoint = { day: string; value: number }

export function CandidateDashboard({ name }: { name: string }) {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ActivityPoint[]>([])
  const [range, setRange] = useState<number>(7)
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewData[]>(
    [],
  )
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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
        const res = await fetch(`/api/swipe/activity?range=${range}&type=given`)
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
    const fetchUserMetrics = async () => {
      try {
        const response = await fetch("/api/profile/me")
        if (response.ok) {
          const data = await response.json()
          setUserProfile({
            profileCompletion: data.profileCompletion || 0,
            resumeQuality: data.resumeQuality || 0,
            skillsMatchScore: data.skillsMatchScore || 0,
            avgResponseTime: data.avgResponseTime || 0,
            currentStreak: data.currentStreak || 0,
          })
        }
      } catch (error) {
        console.error("Failed to fetch user metrics:", error)
      } finally {
        setMetricsLoading(false)
      }
    }

    fetchUserMetrics()
  }, [])

  const metrics = [
    {
      label: "Applications Sent",
      value: stats?.likesGiven || 0,
      trend: "+16%",
      icon: Briefcase,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Likes Received",
      value: stats?.likesReceived || 0,
      trend: "+18%",
      icon: Heart,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Response Rate",
      value: stats?.likesGiven
        ? Math.round((stats.likesReceived / stats.likesGiven) * 100)
        : 0,
      trend: stats?.likesGiven
        ? `${Math.round((stats.likesReceived / stats.likesGiven) * 100)}%`
        : "0%",
      suffix: "%",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Active Matches",
      value: stats?.matchesCount || 0,
      trend: "+9%",
      icon: MessageCircle,
      color: "bg-green-100 text-green-700",
    },
  ]

  return (
    <div className="pb-24 md:pb-0">
      <main className="max-w-[1600px]">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s your application overview for today.
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
                        metric.trend === "Active" ? "secondary" : "default"
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
                    const company =
                      match.employer.companyName || match.employer.name
                    const avatar = match.employer.avatar
                    return (
                      <div
                        key={match._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <img
                          src={avatar || "/default-avatar.png"}
                          alt={company}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {company}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {new Date(match.matchedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/messages?matchId=${match._id}`,
                            )
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
                  const company =
                    interview.employer.companyName || interview.employer.name
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
                      <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{interview.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {dateStr}, {timeStr}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {company}
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
                  <div className="mb-3">
                    <h3 className="text-xl md:text-2xl font-bold">
                      Discover More Roles
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Explore companies matching your skills and preferences.
                    Start swiping to find your perfect opportunity.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard/swipe")}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Zap className="w-4 h-4" />
                  Start Exploring
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Profile Completion
                    </span>
                    <span className="text-sm font-semibold">
                      {metricsLoading
                        ? "-"
                        : `${userProfile?.profileCompletion || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${userProfile?.profileCompletion || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Resume Quality</span>
                    <span className="text-sm font-semibold">
                      {metricsLoading
                        ? "-"
                        : `${userProfile?.resumeQuality || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${userProfile?.resumeQuality || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Skills Match Score
                    </span>
                    <span className="text-sm font-semibold">
                      {metricsLoading
                        ? "-"
                        : `${userProfile?.skillsMatchScore || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${userProfile?.skillsMatchScore || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Response Time
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${userProfile?.avgResponseTime ? Math.round(userProfile.avgResponseTime) + "h" : "N/A"}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Conversations
                  </p>
                  <p className="text-lg font-bold">
                    {stats?.matchesCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Current Streak
                  </p>
                  <p className="text-lg font-bold">
                    {metricsLoading
                      ? "-"
                      : `${userProfile?.currentStreak || 0} days`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Interview Rate
                  </p>
                  <p className="text-lg font-bold">
                    {upcomingInterviews.length > 0 ? "Active" : "None"}
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
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(userProfile?.profileCompletion || 0) < 100 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Complete Your Profile
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                    Your profile is {userProfile?.profileCompletion || 0}%
                    complete. Add your certifications and skills to improve
                    visibility.
                  </p>
                </div>
              )}
              {stats && stats.likesReceived > 0 && (
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Boost Your Visibility
                  </p>
                  <p className="text-xs text-purple-800 dark:text-purple-200 mt-1">
                    You're getting interest from employers. Upgrade to reach
                    more companies with a Boost.
                  </p>
                </div>
              )}
              {upcomingInterviews.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Prepare for Interviews
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                    You have {upcomingInterviews.length} upcoming interview
                    {upcomingInterviews.length !== 1 ? "s" : ""}. Check out our
                    interview tips and guides.
                  </p>
                </div>
              )}
              {!upcomingInterviews.length &&
                (!stats?.likesReceived || stats.likesReceived === 0) &&
                (userProfile?.profileCompletion || 0) >= 100 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Start Exploring
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                      Your profile is complete! Explore companies and start
                      swiping to find your perfect match.
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
