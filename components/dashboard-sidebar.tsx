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
  Users,
  AlertCircle,
  Activity,
  DollarSign,
  MapPin,
  BarChart3,
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
import React, { useEffect } from "react"
import { BrandLogo } from "@/components/brand-logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Interviews", href: "/dashboard/interviews", icon: Calendar },
  { name: "Swipe", href: "/dashboard/swipe", icon: Zap },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
]

const adminNavigation = [
  { name: "Overview", href: "/dashboard", icon: IconDashboard },
  { name: "Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Reports", href: "/dashboard/admin/reports", icon: AlertCircle },
  {
    name: "Verifications",
    href: "/dashboard/admin/verifications",
    icon: Shield,
  },
  {
    name: "Subscriptions",
    href: "/dashboard/admin/subscriptions",
    icon: Crown,
  },
  { name: "Activity", href: "/dashboard/admin/activity", icon: Activity },
  { name: "Matches", href: "/dashboard/admin/matches", icon: Users },
  { name: "Swipes", href: "/dashboard/admin/swipes", icon: Zap },
  { name: "Boosts", href: "/dashboard/admin/boosts", icon: Crown },
  { name: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
  { name: "Payments", href: "/dashboard/admin/payments", icon: DollarSign },
  { name: "Locations", href: "/dashboard/admin/locations", icon: MapPin },
  { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "Content", href: "/dashboard/admin/content", icon: FileText },
  { name: "Settings", href: "/settings/account", icon: Settings },
]

import { useDashboard } from "@/components/dashboard-context"

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const { unreadNotifications, unreadMatches, activeRole } = useDashboard()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  useEffect(() => {
    if (!update) return
    const handler = () => {
      try {
        update()
      } catch (error) {
        console.warn("session update listener failed", error)
      }
    }
    window.addEventListener("mutch:session-updated", handler)
    return () => window.removeEventListener("mutch:session-updated", handler)
  }, [update])

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

  const visibleNavigation = session?.user?.isAdmin
    ? adminNavigation
    : navigation

  return (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pt-6">
        <Link href="/home" className="flex items-center gap-3">
          <BrandLogo className="h-8 w-8 md:h-8 md:w-[116px]" alt="Mutch" />
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showUnreadBadge =
              item.href === "/dashboard/messages" && unreadMatches > 0
            const showNotificationsBadge =
              item.href === "/dashboard/notifications" &&
              unreadNotifications > 0
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
                      {unreadMatches > 99 ? "99+" : unreadMatches}
                    </Badge>
                  ) : null}
                  {showNotificationsBadge ? (
                    <Badge className="ml-2 rounded-full px-2 py-0.5 text-[11px]">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
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
