"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminDashboardFront } from "@/components/dashboard/admin-dashboard-front"
import { EmployeeDashboardFront } from "@/components/dashboard/employee-dashboard-front"
import { EmployerDashboardFront } from "@/components/dashboard/employer-dashboard-front"
import { DashboardProfileLink } from "@/components/dashboard/dashboard-shared"
import { Loader2 } from "lucide-react"

type ActiveRole = "employee" | "employer"

type DashboardMatchPreview = {
  _id: string
  lastMessageAt?: string
  lastMessagePreview?: string
  unreadByEmployer?: number
  unreadByEmployee?: number
  employer?: { _id?: string; name?: string; username?: string; avatar?: string }
  employee?: { _id?: string; name?: string; username?: string; avatar?: string }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [activeRole, setActiveRole] = useState<ActiveRole>("employee")
  const [roleLoading, setRoleLoading] = useState(true)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [recentMatches, setRecentMatches] = useState<DashboardMatchPreview[]>(
    [],
  )

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      setRoleLoading(false)
      return
    }

    if (session.user.role !== "both") {
      setRoleLoading(false)
      return
    }

    const loadActiveRole = async () => {
      try {
        const response = await fetch("/api/profile/me", { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()
        const nextRole: ActiveRole =
          data?.activeRole === "employer" ? "employer" : "employee"
        setActiveRole(nextRole)
      } finally {
        setRoleLoading(false)
      }
    }

    loadActiveRole()
  }, [session, status])

  useEffect(() => {
    if (status !== "authenticated") return

    const loadRecentMatches = async () => {
      try {
        const response = await fetch("/api/matches?status=active&limit=4", {
          cache: "no-store",
        })
        if (!response.ok) return
        const data = await response.json()
        setRecentMatches((data?.matches || []) as DashboardMatchPreview[])
      } catch {
        setRecentMatches([])
      }
    }

    void loadRecentMatches()
    const onUpdate = () => void loadRecentMatches()
    window.addEventListener("swrk:messages-updated", onUpdate)
    window.addEventListener("focus", onUpdate)
    return () => {
      window.removeEventListener("swrk:messages-updated", onUpdate)
      window.removeEventListener("focus", onUpdate)
    }
  }, [status])

  const handleSwitchRole = async (nextRole: ActiveRole) => {
    if (!session?.user || switchingRole || nextRole === activeRole) return
    const previousRole = activeRole
    setActiveRole(nextRole)
    setSwitchingRole(true)

    try {
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeRole: nextRole,
          user: { activeRole: nextRole },
        }),
      })

      if (!response.ok) {
        setActiveRole(previousRole)
      }
    } catch {
      setActiveRole(previousRole)
    } finally {
      setSwitchingRole(false)
    }
  }

  const dashboardView = useMemo(() => {
    if (session?.user?.isAdmin) {
      return "admin" as const
    }

    const role = session?.user?.role
    if (role === "employer") {
      return "employer" as const
    }
    if (role === "both") {
      return activeRole
    }
    return "employee" as const
  }, [activeRole, session?.user?.isAdmin, session?.user?.role])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const name = session.user.name || "there"

  return (
    <div className="min-h-screen">
      <div className="flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {recentMatches.length > 0 ? (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent messages</CardTitle>
              <CardDescription>
                Jump back into the latest conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recentMatches.map((match) => {
                  const currentUserId = session.user.id
                  const isEmployer =
                    String(match.employer?._id) === currentUserId
                  const other = isEmployer ? match.employee : match.employer
                  const unread = isEmployer
                    ? match.unreadByEmployer || 0
                    : match.unreadByEmployee || 0

                  return (
                    <Link
                      key={match._id}
                      href={`/dashboard/messages?matchId=${match._id}`}
                      className="min-w-[240px] rounded-2xl border border-border bg-background p-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-border">
                          <AvatarImage
                            src={other?.avatar}
                            alt={other?.name || "Match"}
                          />
                          <AvatarFallback>
                            {(other?.name || "M")
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">
                              {other?.name || other?.username || "Match"}
                            </span>
                            {unread > 0 ? (
                              <Badge className="rounded-full px-2 py-0.5 text-[11px]">
                                {unread > 99 ? "99+" : unread}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {match.lastMessagePreview || "New conversation"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
        {roleLoading ? (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
              Loading dashboard...
            </CardContent>
          </Card>
        ) : null}

        {!roleLoading && dashboardView === "admin" ? (
          <AdminDashboardFront name={name} />
        ) : null}
        {!roleLoading && dashboardView === "employer" ? (
          <EmployerDashboardFront name={name} />
        ) : null}
        {!roleLoading && dashboardView === "employee" ? (
          <EmployeeDashboardFront name={name} />
        ) : null}

        <DashboardProfileLink href={`/${session.user.username || ""}`} />
      </div>
    </div>
  )
}
