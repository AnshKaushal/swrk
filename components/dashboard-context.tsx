"use client"

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react"
import { useSession } from "next-auth/react"

interface DashboardContextType {
  unreadNotifications: number
  unreadMatches: number
  activeRole: "employee" | "employer" | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMatches, setUnreadMatches] = useState(0)
  const [activeRole, setActiveRole] = useState<"employee" | "employer" | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      setIsLoading(true)

      // Fetch notifications unread
      const [notifRes, matchesRes] = await Promise.all([
        fetch("/api/notifications/unread", { cache: "no-store" }),
        fetch("/api/matches?status=active&limit=100", { cache: "no-store" }),
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setUnreadNotifications(data.unread || 0)
      }

      if (matchesRes.ok) {
        const data = await matchesRes.json()
        const matches = Array.isArray(data?.matches) ? data.matches : []
        const totalUnread = matches.reduce((count: number, match: any) => {
          const isEmployer =
            String(match?.employer?._id || match?.employer) === session.user.id
          const unread = isEmployer
            ? match?.unreadByEmployer || 0
            : match?.unreadByEmployee || 0
          return count + unread
        }, 0)
        setUnreadMatches(totalUnread)
      }

      // Fetch active role if needed
      if (session.user.role === "both") {
        const roleRes = await fetch("/api/profile/me", { cache: "no-store" })
        if (roleRes.ok) {
          const data = await roleRes.json()
          setActiveRole(
            data?.activeRole === "employer" ? "employer" : "employee",
          )
        }
      } else {
        setActiveRole(
          session.user.role === "employer" ? "employer" : "employee",
        )
      }
    } catch (error) {
      console.warn("Failed to refetch dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, status, session?.user?.role])

  useEffect(() => {
    if (status !== "authenticated") return

    void refetch()

    const onFocus = () => void refetch()
    const onMessageUpdate = () => void refetch()
    const onNotificationUpdate = () => void refetch()

    window.addEventListener("focus", onFocus)
    window.addEventListener("mutch:messages-updated", onMessageUpdate)
    window.addEventListener("mutch:notifications-updated", onNotificationUpdate)

    // Poll every 60 seconds instead of 15
    const interval = window.setInterval(() => void refetch(), 60000)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("mutch:messages-updated", onMessageUpdate)
      window.removeEventListener(
        "mutch:notifications-updated",
        onNotificationUpdate,
      )
      window.clearInterval(interval)
    }
  }, [status, refetch])

  return (
    <DashboardContext.Provider
      value={{
        unreadNotifications,
        unreadMatches,
        activeRole,
        isLoading,
        refetch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within DashboardProvider")
  }
  return context
}
