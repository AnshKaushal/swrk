"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { ArrowRight, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const SwipeDeck = dynamic(() => import("@/components/swipe/SwipeDeck"), {
  ssr: false,
})

const quickLinks = [
  {
    title: "Profile",
    description: "Edit your public profile and work history.",
    href: "/settings/profile",
    icon: UserCircle2,
  },
  {
    title: "Verification",
    description: "Submit verification details and documents.",
    href: "/settings/verification",
    icon: ShieldCheck,
  },
  {
    title: "Subscription",
    description: "Review plans and unlock premium discovery.",
    href: "/settings/subscription",
    icon: Sparkles,
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()

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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[1.5fr_1fr] lg:p-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit">
              Dashboard
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back, {session.user.name || "there"}.
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Discover new candidates, jump into your profile settings, and keep your hiring workflow moving from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#discover">
                  Start swiping <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#links">Quick links</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Profile status", value: "Ready" },
              { label: "Matching mode", value: "Live" },
              { label: "AI", value: "Auto after 25 swipes" },
            ].map((item) => (
              <Card key={item.label} className="border-border/60 bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="discover" className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="border-b border-border/60">
              <CardTitle>Discover</CardTitle>
              <CardDescription>
                Swipe through candidate cards. Drag left or right on the card, or use the action buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <SwipeDeck />
            </CardContent>
          </Card>

          <div id="links" className="space-y-4">
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>
                  Jump into profile and settings without leaving the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Button
                      key={link.href}
                      variant="outline"
                      asChild
                      className="h-auto w-full justify-start rounded-2xl p-4"
                    >
                      <Link href={link.href} className="flex w-full items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5" />
                        <span className="flex-1 text-left">
                          <span className="block text-sm font-semibold">{link.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Profile Link</CardTitle>
                <CardDescription>
                  Share your public profile or open it in a new tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Button variant="secondary" asChild className="w-full">
                  <Link href={`/${session.user.username || ""}`}>
                    Open public profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
