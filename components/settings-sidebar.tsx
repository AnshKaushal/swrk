"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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
import React from "react"

const navigation = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Filters", href: "/settings/role-filters", icon: Filter },
  { name: "Resumes", href: "/settings/resume", icon: FileText },
  { name: "Privacy", href: "/settings/privacy", icon: Shield },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Subscription", href: "/settings/subscription", icon: Crown },
  { name: "Account", href: "/settings/account", icon: Settings },
]

export function SettingsSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session, status, update } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  React.useEffect(() => {
    if (!update) return
    const handler = () => {
      try {
        update()
      } catch (err) {
        console.warn("session update listener failed", err)
      }
    }
    window.addEventListener("swrk:session-updated", handler)
    return () => window.removeEventListener("swrk:session-updated", handler)
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
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
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
                  {item.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <ModeToggle />
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
                    {session.user.name || "Profile"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" forceMount>
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
        </div>
      </div>
    </nav>
  )
}
