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
  Calendar,
  CheckCircle2,
  TrendingUp,
  Zap,
  Settings,
  Bell,
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
}

const chartData = [
  { day: "MON", value: 40 },
  { day: "TUE", value: 65 },
  { day: "WED", value: 50 },
  { day: "THU", value: 90 },
  { day: "FRI", value: 75 },
  { day: "SAT", value: 30 },
  { day: "SUN", value: 20 },
]

export function RecruiterDashboard({ name }: { name: string }) {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

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

  const metrics = [
    {
      label: "Total Matches",
      value: stats?.matchesCount || 0,
      trend: "+12%",
      icon: Briefcase,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Active Conversations",
      value: Math.floor((stats?.matchesCount || 0) * 0.3),
      trend: "+5%",
      icon: MessageCircle,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Interviews",
      value: Math.floor((stats?.matchesCount || 0) * 0.15),
      trend: "Busy",
      icon: Calendar,
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Hired",
      value: Math.floor((stats?.matchesCount || 0) * 0.08),
      trend: "Goal",
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
    },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <main className="max-w-[1600px]">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Recruiter Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {name}. Here&apos;s your velocity for today.
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
                <CardContent className="pt-6">
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
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Matching Activity</CardTitle>
              <select className="text-sm border border-border rounded-md bg-background px-3 py-1">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
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
                        <Button variant="ghost" size="sm">
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
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Interview Scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    Today, 2:00 PM - Google Meet
                  </p>
                </div>
                <Badge className="text-xs">JOIN</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Review Portfolio</p>
                  <p className="text-xs text-muted-foreground">
                    Creative Director Candidate
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Email Follow-ups</p>
                  <p className="text-xs text-muted-foreground">
                    Send offer letters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-gradient-to-br from-primary/15 to-primary/5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <CardContent className="pt-8 relative z-10">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                    <h3 className="text-xl md:text-2xl font-bold">
                      Find Your Next Star
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start a velocity session and discover top talent matching
                    your criteria in minutes.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/dashboard/swipe")}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Zap className="w-4 h-4" />
                  Start Velocity Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
