"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"

type PricingCardProps = {
  titleBadge: string
  priceLabel: string
  priceSuffix?: string
  features: string[]
  cta?: string
  ctaText?: string
  className?: string
}

function FilledCheck() {
  return (
    <div className="bg-primary text-primary-foreground rounded-full p-0.5">
      <CheckIcon className="size-3" strokeWidth={3} />
    </div>
  )
}

function PricingCard({
  titleBadge,
  priceLabel,
  priceSuffix = "/month",
  features,
  cta = "/signup",
  className,
  ctaText = "Subscribe",
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "bg-background border-foreground/10 relative overflow-hidden rounded-2xl border",
        "supports-[backdrop-filter]:bg-background/10 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <Badge variant="secondary">{titleBadge}</Badge>
        <div className="ml-auto">
          <Button variant="outline" asChild>
            <Link href={cta}>{ctaText}</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-2 px-4 py-2">
        <span className="font-mono text-5xl font-semibold tracking-tight">
          {priceLabel}
        </span>
        {priceLabel.toLowerCase() !== "free" && (
          <span className="text-muted-foreground text-sm">{priceSuffix}</span>
        )}
      </div>

      <ul className="text-muted-foreground grid gap-4 p-4 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3">
            <FilledCheck />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-32"
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your career goals. Start free and upgrade as
          you grow.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-8">
        <div
          className={cn(
            "bg-background border-foreground/10 relative w-full overflow-hidden rounded-2xl border",
            "supports-[backdrop-filter]:bg-background/10 backdrop-blur",
            "lg:col-span-5",
          )}
        >
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
            <div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 size-full mix-blend-overlay",
                  "bg-[linear-gradient(to_right,--theme(--color-foreground/.1)_1px,transparent_1px)]",
                  "bg-[size:24px]",
                )}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Badge variant="secondary">PROFESSIONAL</Badge>
            <Badge variant="outline" className="hidden lg:flex">
              <SparklesIcon className="me-1 size-3" /> Most Popular
            </Badge>
            <div className="ml-auto">
              <Button>Get Started</Button>
            </div>
          </div>
          <div className="flex flex-col p-4 lg:flex-row">
            <div className="pb-4 lg:w-[30%]">
              <span className="font-mono text-5xl font-semibold tracking-tight">
                $29
              </span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <ul className="text-muted-foreground grid gap-4 text-sm lg:w-[70%]">
              {[
                "Unlimited job swipes and matches",
                "Advanced AI-powered matching",
                "Priority visibility to employers",
                "Detailed analytics and insights",
                "Anonymous messaging with verified companies",
                "Smart scheduling integration",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <FilledCheck />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <PricingCard
          titleBadge="FREE"
          priceLabel="$0"
          features={[
            "Basic job search and swiping",
            "Limited daily matches",
            "Standard profile visibility",
            "Basic messaging with matches",
          ]}
          cta="/signup"
          ctaText="Get Started"
          className="lg:col-span-3"
        />

        <PricingCard
          titleBadge="RECRUITER"
          priceLabel="$99"
          features={[
            "Post unlimited job openings",
            "Access to premium candidate pool",
            "Advanced candidate analytics",
            "Bulk messaging and scheduling",
            "Team collaboration tools",
            "Priority support",
          ]}
          cta="/signup"
          ctaText="Start Hiring"
          className="lg:col-span-4"
        />

        <PricingCard
          titleBadge="ENTERPRISE"
          priceLabel="Custom"
          priceSuffix=""
          features={[
            "Everything in Recruiter plan",
            "White-label solution",
            "Custom integrations and API access",
            "Dedicated account management",
            "Advanced reporting and analytics",
            "SLA guarantees",
          ]}
          cta="/contact"
          ctaText="Contact Sales"
          className="lg:col-span-4"
        />
      </div>
    </section>
  )
}
