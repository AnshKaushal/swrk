"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  User,
  Shield,
  Bell,
  Settings,
  Crown,
  Filter,
  FileText,
  LogOut,
  UserCircle,
  Zap,
  MessageSquare,
  Calendar,
  Briefcase,
} from "lucide-react"
import { ModeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { IconDashboard } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import React from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Interviews", href: "/dashboard/interviews", icon: Calendar },
  { name: "Swipe", href: "/dashboard/swipe", icon: Zap },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Verification", href: "/settings/verification", icon: Shield },
  { name: "Filters", href: "/settings/role-filters", icon: Filter },
  { name: "Resumes", href: "/settings/resume", icon: FileText },
  { name: "Privacy", href: "/settings/privacy", icon: Shield },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Subscription", href: "/settings/subscription", icon: Crown },
  { name: "Account", href: "/settings/account", icon: Settings },
]

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifUnread, setNotifUnread] = React.useState(0)
  const [activeRole, setActiveRole] = React.useState<
    "employee" | "employer" | null
  >(null)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const loadUnreadCount = React.useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      // messages / matches unread (keep previous behavior)
      const response = await fetch("/api/matches?status=active&limit=100", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const matches = Array.isArray(data?.matches) ? data.matches : []
        const totalUnread = matches.reduce((count: number, match: any) => {
          const isEmployer =
            String(match?.employer?._id || match?.employer) === session.user.id
          const unread = isEmployer
            ? match?.unreadByEmployer || 0
            : match?.unreadByEmployee || 0
          return count + unread
        }, 0)
        setUnreadCount(totalUnread)
      }

      // notifications unread
      const nres = await fetch("/api/notifications/unread", {
        cache: "no-store",
      })
      if (nres.ok) {
        const nd = await nres.json()
        setNotifUnread(nd.unread || 0)
      }
    } catch (error) {
      console.warn("failed to load unread count", error)
    }
  }, [session?.user?.id, status])

  const loadActiveRole = React.useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setActiveRole(null)
      return
    }

    try {
      const response = await fetch("/api/profile/me", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      setActiveRole(data?.activeRole === "employer" ? "employer" : "employee")
    } catch (error) {
      console.warn("failed to load active role", error)
    }
  }, [session?.user?.id, status])

  React.useEffect(() => {
    if (!update) return
    const handler = () => {
      try {
        update()
      } catch (error) {
        console.warn("session update listener failed", error)
      }
    }
    window.addEventListener("swrk:session-updated", handler)
    return () => window.removeEventListener("swrk:session-updated", handler)
  }, [update])

  React.useEffect(() => {
    void loadUnreadCount()
    void loadActiveRole()
    const onFocus = () => {
      void loadUnreadCount()
      void loadActiveRole()
    }
    const onMessageUpdate = () => void loadUnreadCount()
    window.addEventListener("focus", onFocus)
    window.addEventListener("swrk:messages-updated", onMessageUpdate)
    const interval = window.setInterval(() => {
      void loadUnreadCount()
      void loadActiveRole()
    }, 15000)

    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("swrk:messages-updated", onMessageUpdate)
      window.clearInterval(interval)
    }
  }, [loadActiveRole, loadUnreadCount])

  const getAvatarUrl = () => {
    if (session?.user?.avatar) {
      return session.user.avatar
    }

    if (session?.user?.name) {
      const firstLetter = session.user.name.charAt(0).toUpperCase()
      return `https://dummyimage.com/200x200/0a0a0a/efefef?text=${firstLetter}`
    }

    return `https://dummyimage.com/200x200/0a0a0a/efefef?text=U`
  }

  const getAvatarFallback = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase()
    }

    return "U"
  }

  const canShowJobs =
    session?.user?.role === "employer" ||
    (session?.user?.role === "both" && activeRole === "employer")
  const visibleNavigation = navigation.filter(
    (item) => item.href !== "/dashboard/jobs" || canShowJobs,
  )

  return (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pt-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/swrk.svg" alt="Swrk" className="h-8 w-8 object-contain" />
          <span className="font-semibold">Swrk</span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showUnreadBadge =
              item.href === "/dashboard/messages" && unreadCount > 0
            const showNotificationsBadge =
              item.href === "/dashboard/notifications" && notifUnread > 0
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {showUnreadBadge ? (
                    <Badge className="ml-auto rounded-full px-2 py-0.5 text-[11px]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  ) : null}
                  {showNotificationsBadge ? (
                    <Badge className="ml-2 rounded-full px-2 py-0.5 text-[11px]">
                      {notifUnread > 99 ? "99+" : notifUnread}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {status === "authenticated" && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-2 pr-3 transition-colors hover:bg-muted"
                >
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage
                      src={getAvatarUrl()}
                      alt={session.user.name || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-24 truncate text-sm font-medium">
                    @{session.user.username || "username"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${session.user.username || ""}`}
                    className="cursor-pointer"
                    onClick={onClose}
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard"
                    className="cursor-pointer"
                    onClick={onClose}
                  >
                    <IconDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}
