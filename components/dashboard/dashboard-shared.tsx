import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type DashboardStat = {
  label: string
  value: string
}

export type DashboardLink = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

type DashboardHeroProps = {
  badge: string
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction: {
    label: string
    href: string
  }
  stats: DashboardStat[]
}

type DashboardLinkListProps = {
  title: string
  description: string
  links: DashboardLink[]
}

type DashboardSectionCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function DashboardHero({
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  stats,
}: DashboardHeroProps) {
  return (
    <section className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[1.5fr_1fr] lg:p-8">
      <div className="space-y-4">
        <span className="badge inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {badge}
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={primaryAction.href}>
              {primaryAction.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {stats.map((item) => (
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
  )
}

export function DashboardSectionCard({
  title,
  description,
  children,
}: DashboardSectionCardProps) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  )
}

export function DashboardLinkList({
  title,
  description,
  links,
}: DashboardLinkListProps) {
  return (
    <DashboardSectionCard title={title} description={description}>
      <div className="space-y-3">
        {links.map((link) => {
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
                  <span className="block text-sm font-semibold">
                    {link.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </span>
              </Link>
            </Button>
          )
        })}
      </div>
    </DashboardSectionCard>
  )
}

export function DashboardProfileLink({ href }: { href: string }) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Profile Link</CardTitle>
        <CardDescription>
          Share your public profile or open it in a new tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Button variant="secondary" asChild className="w-full sm:w-auto">
          <Link href={href}>
            Open public profile <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardActionCard({
  title,
  description,
  href,
  icon: Icon,
}: DashboardLink) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href={href}>
            Open <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
