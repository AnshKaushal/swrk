"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AdminDashboardFront } from "@/components/dashboard/admin-dashboard-front"
import { EmployeeDashboardFront } from "@/components/dashboard/employee-dashboard-front"
import { EmployerDashboardFront } from "@/components/dashboard/employer-dashboard-front"
import { DashboardProfileLink } from "@/components/dashboard/dashboard-shared"
import { Loader2 } from "lucide-react"
import { IconLoader2 } from "@tabler/icons-react"

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
    window.addEventListener("mutch:messages-updated", onUpdate)
    window.addEventListener("focus", onUpdate)
    return () => {
      window.removeEventListener("mutch:messages-updated", onUpdate)
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
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
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
        {roleLoading ? (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              <Loader2 className="inline-block h-4 w-4 animate-spin" />
              Loading dashboard...
            </CardContent>
          </Card>
        ) : null}

        {!roleLoading && session?.user?.role === "both" && (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Switch Role</CardTitle>
              <CardDescription>
                Choose your active role for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                variant={activeRole === "employee" ? "default" : "outline"}
                onClick={() => handleSwitchRole("employee")}
                disabled={switchingRole}
                className="flex items-center gap-2"
              >
                {switchingRole && activeRole === "employee" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Employee
              </Button>
              <Button
                variant={activeRole === "employer" ? "default" : "outline"}
                onClick={() => handleSwitchRole("employer")}
                disabled={switchingRole}
                className="flex items-center gap-2"
              >
                {switchingRole && activeRole === "employer" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Employer
              </Button>
            </CardContent>
          </Card>
        )}

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
