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
  Server,
  DollarSign,
  BarChart3,
  TrendingDown,
} from "lucide-react"

interface AdminStatsData {
  totalUsers?: number
  activeUsers?: number
  pendingReports?: number
  pendingVerifications?: number
  activeSubscriptions?: number
  systemHealth?: number
  monthlyRevenue?: number
  avgSessionTime?: number
  bounceRate?: number
  supportTickets?: number
  databaseHealth?: number
  apiUptime?: number
  serverLoad?: number
}

type ChartPoint = { day: string; users: number; reports: number }

export function AdminDashboard({ name }: { name: string }) {
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch("/api/admin/activity?range=7")
        if (response.ok) {
          const data = await response.json()
          setChartData(data.activity || [])
        }
      } catch (error) {
        console.error("Failed to fetch activity chart:", error)
      } finally {
        setChartLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const metrics = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Active Users (30d)",
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Pending Reports",
      value: stats?.pendingReports || 0,
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "Active Subscriptions",
      value: stats?.activeSubscriptions || 0,
      icon: DollarSign,
      color: "bg-purple-100 text-purple-700",
    },
  ]

  const secondMetrics = [
    {
      label: "Pending Verifications",
      value: stats?.pendingVerifications || 0,
      icon: ShieldAlert,
    },
    {
      label: "Database Health",
      value: stats?.databaseHealth ?? 0,
      suffix: "%",
      icon: Server,
    },
    {
      label: "API Uptime (s)",
      value: stats?.apiUptime ?? 0,
      icon: TrendingUp,
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
                className={`border border-border/50 bg-card hover:shadow-md transition-shadow ${isAlert ? "ring-1 ring-red-100/60" : ""}`}
              >
                <CardContent>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${metric.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {(metric as any).trend ? (
                      <Badge
                        variant={isAlert ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {(metric as any).trend}
                      </Badge>
                    ) : null}
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
          <Card className="lg:col-span-2 border border-border/50 bg-card hover:shadow-md">
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

          <Card className="border border-border/50 bg-card hover:shadow-md">
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
                      {loading ? "-" : stats?.pendingReports || 0}
                    </Badge>
                  </div>
                  <div className="w-full bg-red-200/50 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{
                        width: stats?.pendingReports
                          ? Math.min(stats.pendingReports * 3, 100) + "%"
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Verifications</p>
                    <Badge variant="secondary" className="text-xs">
                      {loading ? "-" : stats?.pendingVerifications || 0}
                    </Badge>
                  </div>
                  <div className="w-full bg-orange-200/50 rounded-full h-1.5">
                    <div
                      className="bg-orange-600 h-1.5 rounded-full"
                      style={{
                        width: stats?.pendingVerifications
                          ? Math.min(stats.pendingVerifications * 2, 100) + "%"
                          : "0%",
                      }}
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
          <Card className="border border-border/50 bg-card hover:shadow-md">
            <CardHeader>
              <CardTitle>Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/30 border border-red-200/50">
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded-lg border border-border">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {loading ? "-" : stats?.pendingReports || 0} User Reports
                  </p>
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
                    {loading ? "-" : stats?.pendingVerifications || 0} Pending
                    Verifications
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
                    {loading ? "-" : stats?.pendingReports || 0} user reports
                    need your attention. Review suspected violations and take
                    moderation actions.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border/50 bg-card hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Database</span>
                    <span className="text-sm font-semibold">
                      {loading ? "-" : `${stats?.databaseHealth || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats?.databaseHealth || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">API Uptime</span>
                    <span className="text-sm font-semibold">
                      {loading ? "-" : `${stats?.apiUptime || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats?.apiUptime || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Server Load</span>
                    <span className="text-sm font-semibold">
                      {loading ? "-" : `${stats?.serverLoad || 0}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats?.serverLoad || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Platform Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Monthly Revenue
                  </p>
                  <p className="text-lg font-bold">
                    {loading
                      ? "-"
                      : `₹${(stats?.monthlyRevenue || 0).toLocaleString("en-IN")}`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Session Time
                  </p>
                  <p className="text-lg font-bold">
                    {loading ? "-" : stats?.avgSessionTime || "N/A"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Bounce Rate
                  </p>
                  <p className="text-lg font-bold">
                    {loading ? "-" : `${stats?.bounceRate || 0}%`}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Support Tickets
                  </p>
                  <p className="text-lg font-bold">
                    {loading ? "-" : stats?.supportTickets || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {chartLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading activities...
                </p>
              ) : chartData && chartData.length > 0 ? (
                chartData.slice(0, 3).map((activity: any, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {activity.users
                          ? `${activity.users} new users registered`
                          : activity.reports
                            ? `${activity.reports} reports submitted`
                            : "System activity"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.day}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activities yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/50 bg-card hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Admin Actions & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Monitor User Growth
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  {loading
                    ? "Loading..."
                    : `Total users: ${stats?.totalUsers || 0}, Active users: ${stats?.activeUsers || 0}`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Resolve Pending Verifications
                </p>
                <p className="text-xs text-purple-800 dark:text-purple-200 mt-1">
                  {loading
                    ? "Loading..."
                    : `${stats?.pendingVerifications || 0} users awaiting verification. Process batch verifications to improve user experience.`}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  System Performance
                </p>
                <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                  {loading
                    ? "Loading..."
                    : `System health: ${stats?.databaseHealth || 0}% uptime. Database optimization scheduled for next week.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
