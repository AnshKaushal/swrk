"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { FocusRail, type FocusRailItem } from "@/components/ui/focus-rails"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  X,
  Heart,
  Sparkles,
  MapPin,
  Briefcase,
  Building2,
  Clock3,
  Rocket,
} from "lucide-react"

type Candidate = {
  _id: string
  name: string
  username?: string
  avatar?: string
  headline?: string
  bio?: string
  skills?: string[]
  isVerified?: boolean
  profileVerified?: boolean
  currentCity?: string
  currentState?: string
  currentCountry?: string
  preferredLocations?: string[]
  workPreference?: string
  expectedCTC?: {
    min?: number
    max?: number
    currency?: string
    period?: string
    isNegotiable?: boolean
  }
  employmentType?: string[]
  currentStatus?: string
  desiredRoles?: string[]
  desiredIndustries?: string[]
  companyName?: string
  companySize?: string
  companyType?: string
  companyTagline?: string
  companyDescription?: string
  headquarters?: string
  workStyle?: string
  industry?: string[]
  activeOpenings?: Array<{
    title?: string
    location?: string
    locationType?: string
    employmentType?: string
    ctcMin?: number
    ctcMax?: number
    currency?: string
    ctcPeriod?: string
    isActive?: boolean
    requiredSkills?: string[]
    preferredSkills?: string[]
  }>
  filters?: {
    locations?: string[]
    employmentTypes?: string[]
    workPreference?: string[]
    ctcBudgetMin?: number
    ctcBudgetMax?: number
  }
  matchPercent?: number
  jobRequirements?: string[]
  likedYou?: boolean
  likedType?: string | null
}

type Position = {
  _id: string
  title: string
  description: string
  roles: string[]
  locations: string[]
  industry: string
  skills: string[]
  experience: string
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  employmentType: string
  matchCount: number
  employerId: {
    _id: string
    name: string
    avatar?: string
    companyName?: string
  }
}

type SwipeResponse = {
  candidates?: Candidate[]
  rankingMode?: "ai" | "heuristic"
  swipeCount?: number
  swipeQuota?: {
    remaining: number | null
    limit: number | null
    plan: string
    isUnlimited: boolean
    resetAt: string | Date | null
  }
}

function getCandidateImage(candidate: Candidate) {
  if (candidate.avatar) return candidate.avatar
  const initial = candidate.name?.charAt(0)?.toUpperCase() || "U"
  return `https://dummyimage.com/960x1280/0f172a/e2e8f0&text=${encodeURIComponent(initial)}`
}

function formatMoney(
  value?: number,
  currency = "INR",
  prefix = "",
  suffix = "",
) {
  if (typeof value !== "number" || Number.isNaN(value)) return ""

  const symbol = currency === "INR" ? "₹" : `${currency} `
  return `${prefix}${symbol}${new Intl.NumberFormat("en-IN").format(value)}${suffix}`
}

function formatMoneyRange(min?: number, max?: number, currency = "INR") {
  if (typeof min !== "number" && typeof max !== "number") return "Open"
  if (typeof min === "number" && typeof max === "number") {
    return `${formatMoney(min, currency)} - ${formatMoney(max, currency)}`
  }
  if (typeof min === "number") return `From ${formatMoney(min, currency)}`
  return `Up to ${formatMoney(max, currency)}`
}

function formatList(values?: string[], limit = 2) {
  const cleaned = (values || []).filter(Boolean)
  if (cleaned.length === 0) return ""
  return cleaned.slice(0, limit).join(", ")
}

function getActiveOpening(candidate?: Candidate) {
  return (
    candidate?.activeOpenings?.find((opening) => opening.isActive) ||
    candidate?.activeOpenings?.[0]
  )
}

type QueueItem = {
  type: "candidate" | "position"
  candidate?: Candidate
  position?: Position
}

export default function SwipeRailDeck() {
  const { data: session } = useSession()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [swipeCount, setSwipeCount] = useState(0)
  const [swipeQuota, setSwipeQuota] = useState<SwipeResponse["swipeQuota"]>()
  const [superQuota, setSuperQuota] = useState<any>()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const [actionPulse, setActionPulse] = useState<
    "left" | "right" | "super" | null
  >(null)
  const lock = useRef(false)
  const pulseTimer = useRef<number | null>(null)

  const viewerRole =
    (session?.user as { activeRole?: string; role?: string } | undefined)
      ?.activeRole ||
    session?.user?.role ||
    "employee"
  const isEmployerMode = viewerRole === "employer"

  useEffect(() => {
    void loadQueue()
  }, [])

  useEffect(() => {
    return () => {
      if (pulseTimer.current) {
        window.clearTimeout(pulseTimer.current)
      }
    }
  }, [])

  const focusItems = useMemo<FocusRailItem[]>(() => {
    return queue.map((item) => {
      if (item.type === "position" && item.position) {
        return {
          id: item.position._id,
          title: item.position.title,
          description: item.position.description.substring(0, 80),
          imageSrc:
            item.position.employerId?.avatar ||
            `https://dummyimage.com/960x1280/0f172a/e2e8f0&text=${encodeURIComponent(item.position.title.charAt(0))}`,
          meta: formatList(item.position.locations, 1) || "Remote",
        }
      }

      const candidate = item.candidate!
      return {
        id: candidate._id,
        title: candidate.name,
        description: candidate.headline || candidate.bio || "Ready to explore",
        imageSrc: getCandidateImage(candidate),
        href: candidate.username ? `/${candidate.username}` : undefined,
        meta: isEmployerMode
          ? candidate.currentCity || formatList(candidate.preferredLocations)
          : candidate.companyName || candidate.headquarters || undefined,
      }
    })
  }, [queue, isEmployerMode])

  const currentItem = queue[activeIndex]
  const currentCandidate =
    currentItem?.type === "candidate" ? currentItem.candidate : null
  const currentPosition =
    currentItem?.type === "position" ? currentItem.position : null
  const currentOpening = useMemo(
    () => (currentCandidate ? getActiveOpening(currentCandidate) : null),
    [currentCandidate],
  )

  const detailsData = useMemo(() => {
    if (currentPosition) {
      return [
        {
          label: "Role",
          value: formatList(currentPosition.roles, 2) || "Multiple roles",
        },
        {
          label: "Location",
          value: formatList(currentPosition.locations, 2) || "Remote",
        },
        {
          label: "Industry",
          value: currentPosition.industry || "Open",
        },
        {
          label: "Experience",
          value: currentPosition.experience || "Any",
        },
        {
          label: "Type",
          value: currentPosition.employmentType || "Full-time",
        },
        {
          label: "Salary",
          value: formatMoneyRange(
            currentPosition.salaryRange?.min,
            currentPosition.salaryRange?.max,
            currentPosition.salaryRange?.currency,
          ),
        },
      ]
    }

    if (!currentCandidate) return [] as Array<{ label: string; value: string }>

    if (isEmployerMode) {
      return [
        {
          label: "Looking for",
          value:
            formatList(currentCandidate.desiredRoles, 3) ||
            "Open to the right role",
        },
        {
          label: "Preferred locations",
          value:
            formatList(currentCandidate.preferredLocations, 3) ||
            currentCandidate.currentCity ||
            "Remote",
        },
        {
          label: "Work preference",
          value:
            currentCandidate.workPreference?.replace("-", " ") || "Flexible",
        },
        {
          label: "Expected salary",
          value: formatMoneyRange(
            currentCandidate.expectedCTC?.min,
            currentCandidate.expectedCTC?.max,
            currentCandidate.expectedCTC?.currency,
          ),
        },
        {
          label: "Employment type",
          value: formatList(currentCandidate.employmentType, 3) || "Any",
        },
        {
          label: "Status",
          value: currentCandidate.currentStatus || "Open",
        },
      ]
    }

    return [
      {
        label: "Company",
        value: currentCandidate.companyName || currentCandidate.name,
      },
      {
        label: "Role",
        value: currentOpening?.title || currentCandidate.headline || "Hiring",
      },
      {
        label: "Location",
        value:
          [currentOpening?.location, currentOpening?.locationType]
            .filter(Boolean)
            .join(" · ") ||
          currentCandidate.headquarters ||
          formatList(currentCandidate.filters?.locations, 3) ||
          "Flexible",
      },
      {
        label: "Salary",
        value: formatMoneyRange(
          currentOpening?.ctcMin,
          currentOpening?.ctcMax,
          currentOpening?.currency,
        ),
      },
      {
        label: "Job type",
        value:
          currentOpening?.employmentType ||
          formatList(currentCandidate.filters?.employmentTypes, 3) ||
          currentCandidate.workStyle ||
          "Open",
      },
      {
        label: "Company size",
        value:
          currentCandidate.companySize ||
          currentCandidate.industry?.join(", ") ||
          "Open",
      },
    ]
  }, [currentCandidate, currentOpening, isEmployerMode, currentPosition])

  const superDisabled = Boolean(superQuota && superQuota.allowed === false)
  const outOfDailySwipes = Boolean(
    swipeQuota &&
    !swipeQuota.isUnlimited &&
    typeof swipeQuota.remaining === "number" &&
    swipeQuota.remaining <= 0,
  )

  async function loadQueue() {
    setLoading(true)

    try {
      const candidatesRes = await fetch("/api/swipe/candidates?limit=15", {
        cache: "no-store",
      })
      const candidatesData = (await candidatesRes.json()) as SwipeResponse
      const candidates = candidatesData.candidates || []
      setSwipeQuota(candidatesData.swipeQuota)

      const positionsRes = await fetch("/api/positions/candidates?limit=15", {
        cache: "no-store",
      })
      const positionsData = await positionsRes.json()
      const positions = positionsData.positions || []

      const mergedQueue: QueueItem[] = []
      const minLength = Math.min(candidates.length, positions.length)

      for (let i = 0; i < minLength; i++) {
        mergedQueue.push({ type: "candidate", candidate: candidates[i] })
        mergedQueue.push({ type: "position", position: positions[i] })
      }

      if (candidates.length > minLength) {
        for (let i = minLength; i < candidates.length; i++) {
          mergedQueue.push({ type: "candidate", candidate: candidates[i] })
        }
      }

      if (positions.length > minLength) {
        for (let i = minLength; i < positions.length; i++) {
          mergedQueue.push({ type: "position", position: positions[i] })
        }
      }

      setQueue(mergedQueue)
      setActiveIndex(0)

      try {
        const s = await fetch(`/api/swipe/super`, { cache: "no-store" })
        const sj = await s.json()
        setSuperQuota(sj.quota)
      } catch (e) {}
    } catch (error) {
      console.error(error)
      toast.error("Failed to load queue")
    } finally {
      setLoading(false)
    }
  }

  async function doAction(
    direction: "left" | "right" | "super",
    item: QueueItem,
  ) {
    if (lock.current) return false
    lock.current = true

    try {
      let endpoint: string
      let body: any

      if (item.type === "candidate" && item.candidate) {
        endpoint = "/api/swipe"
        body = { targetId: item.candidate._id, direction }
      } else if (item.type === "position" && item.position) {
        if (direction === "super") {
          lock.current = false
          return false
        }
        endpoint = "/api/positions/swipe"
        body = { positionId: item.position._id, direction }
      } else {
        lock.current = false
        return false
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Item no longer available.")
          return false
        }

        if (res.status === 429 && item.type === "candidate") {
          setUpgradeOpen(true)
          toast.error(
            json?.error || "Daily swipe limit reached for your current plan.",
          )
          try {
            const s = await fetch(`/api/swipe/super`, { cache: "no-store" })
            const sj = await s.json()
            setSuperQuota(sj.quota)
          } catch (e) {}
          return false
        }

        toast.error(json?.error || "Failed to perform action")
        return false
      }

      if (typeof json?.remaining !== "undefined") {
        setSwipeQuota((previous) => {
          if (!previous) return previous
          return {
            ...previous,
            remaining: json.remaining,
          }
        })
      }

      if (direction === "super") {
        try {
          const s = await fetch(`/api/swipe/super`, { cache: "no-store" })
          if (s.ok) {
            const sj = await s.json()
            setSuperQuota(sj.quota)
          } else if (typeof json?.superRemaining !== "number") {
            setSuperQuota((prev: any) => {
              if (!prev) return prev
              return {
                ...prev,
                remaining: Math.max(0, (prev.remaining || 0) - 1),
              }
            })
          }
        } catch (e) {
          setSuperQuota((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              remaining: Math.max(0, (prev.remaining || 0) - 1),
            }
          })
        }
      }

      try {
        window.dispatchEvent(new Event("swrk:notifications-updated"))
      } catch (e) {}

      if (json.matched) {
        toast.success(
          item.type === "position"
            ? "It's a match! You can now message the employer."
            : "It's a match!",
        )
      }

      return true
    } catch (error) {
      console.error(error)
      toast.error("Action failed")
      return false
    } finally {
      lock.current = false
    }
  }

  const performSwipe = async (direction: "left" | "right" | "super") => {
    const item = queue[activeIndex]
    if (!item) return

    if (direction === "super" && item.type === "position") {
      return
    }

    if (direction === "super" && superQuota && superQuota.allowed === false) {
      setUpgradeOpen(true)
      return
    }

    const outOfDailySwipes =
      swipeQuota &&
      !swipeQuota.isUnlimited &&
      typeof swipeQuota.remaining === "number" &&
      swipeQuota.remaining <= 0
    if ((direction === "left" || direction === "right") && outOfDailySwipes) {
      setUpgradeOpen(true)
      return
    }

    const success = await doAction(direction, item)
    if (!success) return

    if (pulseTimer.current) {
      window.clearTimeout(pulseTimer.current)
    }
    setActionPulse(direction)
    pulseTimer.current = window.setTimeout(() => {
      setActionPulse(null)
    }, 650)

    setQueue((previous) => {
      const next = [
        ...previous.slice(0, activeIndex),
        ...previous.slice(activeIndex + 1),
      ]
      setActiveIndex((prev) => {
        if (next.length === 0) return 0
        if (prev >= next.length) return next.length - 1
        return prev
      })
      return next
    })

    if (queue.length - 1 <= 6) {
      await loadQueue()
    }
  }

  const triggerSwipe = async (direction: "left" | "right" | "super") => {
    await performSwipe(direction)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const hasContent = queue.length > 0

  if (!hasContent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-6">
        <div className="text-center">
          <p className="text-base font-medium">
            No more items in your queue right now.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll refresh the queue after new profiles and positions are
            available.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void loadQueue()}
          >
            Refresh queue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex w-full max-w-[1600px] flex-col gap-4">
        <FocusRail
          items={focusItems}
          loop
          className="h-[650px] rounded-2xl border"
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />

        <Card className="border-border/60 bg-card/95 p-4 sm:p-5">
          <div className="space-y-4">
            {currentPosition ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    {currentPosition.title}
                  </h3>
                  <Badge variant="secondary">
                    {currentPosition.matchCount} interested
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {currentPosition.description.substring(0, 200)}...
                </p>

                <div className="flex flex-wrap gap-2">
                  {currentPosition.employerId?.companyName && (
                    <Badge variant="outline">
                      {currentPosition.employerId.companyName}
                    </Badge>
                  )}
                  {formatList(currentPosition.locations, 2) && (
                    <Badge variant="outline">
                      {formatList(currentPosition.locations, 2)}
                    </Badge>
                  )}
                  {currentPosition.skills?.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </>
            ) : null}

            {currentCandidate && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    {currentCandidate.name}
                  </h3>
                  {typeof currentCandidate.matchPercent === "number" && (
                    <Badge>Match: {currentCandidate.matchPercent}%</Badge>
                  )}
                  {currentCandidate.likedYou && (
                    <Badge variant="destructive">They liked you</Badge>
                  )}
                  <Badge variant="secondary" className="capitalize">
                    {isEmployerMode ? "hiring view" : "job search view"}
                  </Badge>
                  {(currentCandidate.isVerified ||
                    currentCandidate.profileVerified) && (
                    <Badge variant="outline" className="border-yellow-500">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentCandidate.currentCity ? (
                    <Badge variant="outline">
                      {currentCandidate.currentCity}
                    </Badge>
                  ) : null}
                  {!isEmployerMode && currentCandidate.companyName ? (
                    <Badge variant="outline">
                      {currentCandidate.companyName}
                    </Badge>
                  ) : null}
                  {currentCandidate.username ? (
                    <Badge variant="outline">
                      @{currentCandidate.username}
                    </Badge>
                  ) : null}
                  {currentCandidate.companyType ? (
                    <Badge variant="outline">
                      {currentCandidate.companyType}
                    </Badge>
                  ) : null}
                  {currentCandidate.skills?.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {currentCandidate.companyTagline ? (
                  <p className="text-sm text-muted-foreground">
                    {currentCandidate.companyTagline}
                  </p>
                ) : currentCandidate.bio ? (
                  <p className="text-sm text-muted-foreground">
                    {currentCandidate.bio}
                  </p>
                ) : null}

                {currentCandidate.jobRequirements?.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Required:
                    </span>
                    {currentCandidate.jobRequirements
                      .slice(0, 8)
                      .map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                  </div>
                ) : null}

                <div className="grid gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                  <span>Queue: {queue.length} profiles</span>
                  <span>
                    Plan: {(swipeQuota?.plan || "free").toUpperCase()}
                  </span>
                  <span>
                    {swipeQuota?.isUnlimited
                      ? "Unlimited swipes"
                      : `${swipeQuota?.remaining ?? 0}/${swipeQuota?.limit ?? 0} swipes left`}
                  </span>
                </div>
              </>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void triggerSwipe("left")}
                title={
                  outOfDailySwipes
                    ? "Daily swipe limit reached — upgrade to continue"
                    : undefined
                }
                className="group h-12 border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
              >
                <X className="h-4 w-4 transition-transform group-hover:-rotate-12" />
                Pass
              </Button>

              {currentCandidate && (
                <Button
                  type="button"
                  onClick={() => void triggerSwipe("super")}
                  title={
                    superDisabled
                      ? "No Super Likes left — upgrade to get more"
                      : undefined
                  }
                  className="relative h-12 overflow-hidden bg-rose-500 text-white hover:bg-rose-600"
                >
                  {actionPulse === "super" ? (
                    <span className="absolute right-3 top-2 text-white/90 animate-bounce">
                      <Heart className="h-4 w-4 fill-white" />
                    </span>
                  ) : null}
                  <Sparkles className="h-4 w-4" />
                  Super Like ({superQuota?.remaining ?? 0} /{" "}
                  {superQuota?.limit ?? 0})
                </Button>
              )}

              {currentCandidate?.likedYou && (
                <Button
                  type="button"
                  onClick={() => void triggerSwipe("right")}
                  title={
                    outOfDailySwipes
                      ? "Daily swipe limit reached — upgrade to continue"
                      : undefined
                  }
                  className="group h-12 border border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100"
                >
                  Like Back
                </Button>
              )}

              <Button
                type="button"
                onClick={() => void triggerSwipe("right")}
                title={
                  outOfDailySwipes
                    ? "Daily swipe limit reached — upgrade to continue"
                    : undefined
                }
                className="group relative h-12 overflow-hidden bg-green-500 text-white hover:bg-green-600"
              >
                {actionPulse === "right" ? (
                  <span className="absolute right-3 top-2 text-white/90 animate-ping">
                    <Heart className="h-4 w-4 fill-white" />
                  </span>
                ) : null}
                <Heart className="h-4 w-4 fill-white transition-transform group-hover:scale-110" />
                {currentPosition ? "Apply" : "Like"}
              </Button>
            </div>
          </div>
        </Card>
        <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
          <DialogContent className="w-full max-w-md p-6">
            <DialogHeader>
              <DialogTitle>Upgrade to continue swiping</DialogTitle>
              <DialogDescription>
                You&apos;ve reached your swipe or Super Like limit. Upgrade your
                subscription to get more swipes and boosts.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setUpgradeOpen(false)
                  router.push("/subscription")
                }}
              >
                Upgrade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
