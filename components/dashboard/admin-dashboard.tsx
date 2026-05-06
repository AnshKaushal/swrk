"use client"

import { useEffect, useState } from "react"
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
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Activity,
  Clock,
} from "lucide-react"

interface AdminStatsData {
  totalUsers?: number
  activeUsers?: number
  pendingReports?: number
  pendingVerifications?: number
}

const chartData = [
  { day: "MON", users: 240, reports: 12 },
  { day: "TUE", users: 280, reports: 8 },
  { day: "WED", users: 250, reports: 15 },
  { day: "THU", value: 320, reports: 18 },
  { day: "FRI", users: 350, reports: 10 },
  { day: "SAT", users: 180, reports: 5 },
  { day: "SUN", users: 150, reports: 3 },
]

export function AdminDashboard({ name }: { name: string }) {
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/profile/me")
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalUsers: 1284,
            activeUsers: 892,
            pendingReports: 23,
            pendingVerifications: 45,
          })
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
      label: "Total Users",
      value: stats?.totalUsers || 0,
      trend: "+8%",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Active Users",
      value: stats?.activeUsers || 0,
      trend: "+12%",
      icon: Activity,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Pending Reports",
      value: stats?.pendingReports || 0,
      trend: "Action",
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Verifications",
      value: stats?.pendingVerifications || 0,
      trend: "Review",
      icon: ShieldAlert,
      color: "bg-orange-100 text-orange-700",
    },
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <main className="max-w-[1600px]">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Platform Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor system health, {name}. Keep the platform running smoothly.
          </p>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            const isAlert = idx > 1
            return (
              <Card
                key={idx}
                className={`border ${isAlert ? "border-red-200/50 bg-red-50/30" : "border-border/50"} hover:shadow-md transition-shadow`}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${metric.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge
                      variant={isAlert ? "destructive" : "default"}
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
              <CardTitle>Platform Activity</CardTitle>
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
                    dataKey="users"
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
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Queue Status
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-red-50/50 border border-red-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Reports</p>
                    <Badge variant="destructive" className="text-xs">
                      23
                    </Badge>
                  </div>
                  <div className="w-full bg-red-200/50 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Verifications</p>
                    <Badge variant="secondary" className="text-xs">
                      45
                    </Badge>
                  </div>
                  <div className="w-full bg-orange-200/50 rounded-full h-1.5">
                    <div
                      className="bg-orange-600 h-1.5 rounded-full"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-50/50 border border-green-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">System Health</p>
                    <Badge className="text-xs bg-green-600">Optimal</Badge>
                  </div>
                  <div className="w-full bg-green-200/50 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: "95%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle>Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/30 border border-red-200/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">23 User Reports</p>
                  <p className="text-xs text-muted-foreground">
                    Pending review and action
                  </p>
                </div>
                <Badge className="text-xs">URGENT</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/30 border border-orange-200/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <ShieldAlert className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    45 Pending Verifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submit documents or info
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/30 border border-blue-200/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Scheduled Tasks</p>
                  <p className="text-xs text-muted-foreground">
                    Database cleanup at midnight
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
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    <h3 className="text-xl md:text-2xl font-bold">
                      Review Reports
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    23 user reports need your attention. Review suspected
                    violations and take moderation actions.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <AlertCircle className="w-4 h-4" />
                  Open Moderation Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
