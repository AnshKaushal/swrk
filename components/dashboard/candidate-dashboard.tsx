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
}

type ActivityPoint = { day: string; value: number }

export function CandidateDashboard({ name }: { name: string }) {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ActivityPoint[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [range, setRange] = useState<number>(7)

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
    let mounted = true
    const fetchActivity = async () => {
      setActivityLoading(true)
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
      } finally {
        setActivityLoading(false)
      }
    }

    fetchActivity()
    return () => {
      mounted = false
    }
  }, [range])

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
      label: "Profile Views",
      value: Math.floor((stats?.likesReceived || 0) * 2.5),
      trend: "+24%",
      icon: Eye,
      color: "bg-orange-100 text-orange-700",
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
    <div className="min-h-screen pb-24 md:pb-0">
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
                <CardContent className="pt-6">
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
              <CardTitle>Upcoming Interviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tech Interview</p>
                  <p className="text-xs text-muted-foreground">
                    Tomorrow, 10:00 AM
                  </p>
                </div>
                <Badge className="text-xs">PREPARE</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">HR Round</p>
                  <p className="text-xs text-muted-foreground">
                    Friday, 2:00 PM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Follow Up</p>
                  <p className="text-xs text-muted-foreground">
                    Check application status
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
      </main>
    </div>
  )
}
