"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type UserType = "employee" | "employer" | "both"

type PricingCardProps = {
  titleBadge: string
  priceLabel: string
  priceSuffix?: string
  showPriceSuffix?: boolean
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
  showPriceSuffix = true,
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
        {showPriceSuffix && (
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

type PlanCard = {
  titleBadge: string
  monthlyPrice: number
  features: string[]
  cta: string
  ctaText: string
  className: string
  showPriceSuffix?: boolean
  priceLabelOverride?: string
}

type PricingSection = {
  badge: string
  title: string
  description: string
  hero: PlanCard
  cards: [PlanCard, PlanCard, PlanCard]
}

const pricingByUserType: Record<UserType, PricingSection> = {
  employee: {
    badge: "FOR CANDIDATES",
    title: "Plans built for candidates who want more reach",
    description:
      "Compare the candidate, employer, or both-role plans without changing the layout.",
    hero: {
      titleBadge: "PROFESSIONAL",
      monthlyPrice: 999,
      features: [
        "Unlimited swipes",
        "Maximum profile visibility",
        "Premium priority matching",
        "5 profile boosts per month",
        "Premium reach to top employers",
        "Advanced analytics",
        "Premium support",
        "Early access to new features",
      ],
      cta: "/signup",
      ctaText: "Get Started",
      className: "",
    },
    cards: [
      {
        titleBadge: "BASIC",
        monthlyPrice: 399,
        features: [
          "50 swipes per day",
          "Enhanced profile visibility",
          "Priority in matching",
          "2 profile boosts per month",
          "Standard reach to employers",
          "Basic analytics",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-3",
      },
      {
        titleBadge: "FREE",
        monthlyPrice: 0,
        features: [
          "20 swipes per day",
          "Basic profile visibility",
          "Limited job recommendations",
          "Email notifications",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
      },
      {
        titleBadge: "BOTH",
        monthlyPrice: 699,
        features: [
          "Employee: 50 swipes/day + 2 boosts/month",
          "Employer: 10 job posts + 200 candidate likes/month",
          "Priority matching on both sides",
          "Standard analytics dashboard",
          "Basic support",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
      },
    ],
  },
  employer: {
    badge: "FOR EMPLOYERS",
    title: "Plans built for employers who need hiring volume",
    description:
      "Compare the employer, candidate, and both-role plans without changing the design.",
    hero: {
      titleBadge: "GROWTH",
      monthlyPrice: 2999,
      features: [
        "20 job posts per month",
        "Unlimited candidate profile views",
        "500 candidate likes per month",
        "Advanced filtering options",
        "Team member support (up to 3)",
        "Candidate analytics",
        "Priority candidate matching",
      ],
      cta: "/signup",
      ctaText: "Get Started",
      className: "",
    },
    cards: [
      {
        titleBadge: "ENTERPRISE",
        monthlyPrice: 9999,
        features: [
          "Unlimited job posts",
          "Unlimited candidate profile views",
          "Unlimited candidate likes",
          "Advanced filtering & search",
          "Unlimited team members",
          "Advanced analytics & insights",
          "Dedicated account manager",
          "Priority support",
          "Custom integration support",
          "White-label options available",
        ],
        cta: "/contact",
        ctaText: "Contact Sales",
        className: "lg:col-span-3",
      },
      {
        titleBadge: "FREE",
        monthlyPrice: 0,
        features: [
          "5 job posts per month",
          "View candidate profiles",
          "100 candidate likes per month",
          "Basic candidate filtering",
          "Email notifications",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
      },
      {
        titleBadge: "BOTH",
        monthlyPrice: 699,
        features: [
          "Employee: 50 swipes/day + 2 boosts/month",
          "Employer: 10 job posts + 200 candidate likes/month",
          "Priority matching on both sides",
          "Standard analytics dashboard",
          "Basic support",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
      },
    ],
  },
  both: {
    badge: "FOR BOTH",
    title: "One account for hiring and job hunting",
    description:
      "See the dual-role plans alongside the other audiences so the pricing stays easy to compare.",
    hero: {
      titleBadge: "DUAL BASIC",
      monthlyPrice: 699,
      features: [
        "Employee: 50 swipes/day + 2 boosts/month",
        "Employer: 10 job posts + 200 candidate likes/month",
        "Priority matching on both sides",
        "Standard analytics dashboard",
        "Basic support",
      ],
      cta: "/signup",
      ctaText: "Get Started",
      className: "",
    },
    cards: [
      {
        titleBadge: "DUAL PROFESSIONAL",
        monthlyPrice: 1699,
        features: [
          "Employee: Unlimited swipes + 5 boosts/month",
          "Employer: Unlimited job posts + unlimited candidate likes",
          "Premium priority matching on both sides",
          "Advanced analytics for both roles",
          "Premium support",
          "Early access to features",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-3",
      },
      {
        titleBadge: "FREE",
        monthlyPrice: 0,
        features: [
          "Employee: 20 swipes/day",
          "Employer: 5 job posts + 100 candidate likes/month",
          "Basic profile visibility",
          "Email notifications",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
      },
      {
        titleBadge: "SWITCH",
        monthlyPrice: 0,
        features: [
          "One login for both roles",
          "Switch between hiring and applying anytime",
          "Unified inbox and profile controls",
          "Best when you recruit and job hunt",
        ],
        cta: "/signup",
        ctaText: "Get Started",
        className: "lg:col-span-4",
        priceLabelOverride: "Included",
        showPriceSuffix: false,
      },
    ],
  },
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)
  const [userType, setUserType] = useState<UserType>("employee")

  const getPrice = (monthly: number) =>
    isYearly ? Math.round(monthly * 12 * 0.85) : monthly

  const suffix = isYearly ? "/year" : "/month"
  const section = pricingByUserType[userType]

  const formatPriceLabel = (card: PlanCard) =>
    card.priceLabelOverride ?? `₹${getPrice(card.monthlyPrice)}`

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
          Choose the view that fits your role and compare the live plans side by
          side.
        </p>
      </div>

      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-full border border-foreground/10 bg-background/80 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/10">
          {[
            { value: "employee", label: "For Candidates" },
            { value: "employer", label: "For Employers" },
            { value: "both", label: "For Both" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setUserType(option.value as UserType)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                userType === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <Badge variant="secondary" className="mb-3">
          {section.badge}
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
          {section.title}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {section.description}
        </p>
      </div>

      <div className="my-6 flex items-center justify-center gap-3">
        <span className={!isYearly ? "font-semibold" : ""}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative h-6 w-11 rounded-full bg-muted"
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition",
              isYearly && "translate-x-5",
            )}
          />
        </button>

        <span
          className={cn("flex items-center gap-1", isYearly && "font-semibold")}
        >
          Yearly
          <Badge variant="secondary" className="text-xs">
            Save 15%
          </Badge>
        </span>
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
            <Badge variant="secondary">{section.hero.titleBadge}</Badge>
            <Badge variant="outline" className="hidden lg:flex">
              <SparklesIcon className="me-1 size-3" /> Most Popular
            </Badge>
            <div className="ml-auto">
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col p-4 lg:flex-row">
            <div className="pb-4 lg:w-[30%]">
              <span className="font-mono text-5xl font-semibold tracking-tight">
                ₹{getPrice(section.hero.monthlyPrice)}
              </span>
              <span className="text-muted-foreground text-sm">{suffix}</span>
            </div>

            <ul className="text-muted-foreground grid gap-4 text-sm lg:w-[70%]">
              {section.hero.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <FilledCheck />
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {section.cards.map((card) => (
          <PricingCard
            key={card.titleBadge}
            titleBadge={card.titleBadge}
            priceLabel={formatPriceLabel(card)}
            priceSuffix={suffix}
            showPriceSuffix={card.showPriceSuffix}
            features={card.features}
            cta={card.cta}
            ctaText={card.ctaText}
            className={card.className}
          />
        ))}
      </div>
    </section>
  )
}
