"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Check,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  SparklesIcon,
  Activity,
  MessageCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPlan {
  _id: string
  name: string
  displayName: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  benefits: {
    priorityMatching: boolean
    unlimitedSwipes: boolean
    advancedFilters: boolean
    profileBoost: number
    analytics: boolean
    premiumSupport: boolean
    hideAds: boolean
    earlyAccess: boolean
  }
}

interface UserSubscription {
  _id: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  amount: number
  plan: SubscriptionPlan
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedSubscription, setConfirmedSubscription] =
    useState<UserSubscription | null>(null)
  const [switchConfirmation, setSwitchConfirmation] = useState<{
    show: boolean
    fromPlan: SubscriptionPlan | null
    toPlan: SubscriptionPlan | null
  }>({
    show: false,
    fromPlan: null,
    toPlan: null,
  })
  const [interval, setInterval] = useState<"month" | "year">("month")
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
      return
    }

    if (status === "authenticated") {
      fetchPlans()
      fetchUserSubscription()
    }
  }, [status, router])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscriptions/plans")
      if (response.ok) {
        const data = await response.json()

        // Show proration info if present
        if (data.subscription?.credit && data.subscription.credit > 0) {
          toast.success(
            `A credit of ₹${data.subscription.credit} has been applied to your account.`,
          )
        }

        if (data.subscription?.balanceDue && data.subscription.balanceDue > 0) {
          toast.warning(
            `An additional charge of ₹${data.subscription.balanceDue} is due for prorated upgrade.`,
          )
        }
        setPlans(data)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
      toast.error("Failed to load subscription plans")
    }
  }

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/manage")
      if (response.ok) {
        const data = await response.json()
        setUserSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    const selectedPlan = plans.find((p) => p._id === planId)
    if (!selectedPlan) return

    if (
      userSubscription &&
      userSubscription.status === "active" &&
      userSubscription.plan._id !== planId
    ) {
      setSwitchConfirmation({
        show: true,
        fromPlan: userSubscription.plan,
        toPlan: selectedPlan,
      })
      return
    }

    await proceedWithSubscription(planId)
  }

  const proceedWithSubscription = async (planId: string) => {
    setSubscribing(planId)
    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()

        const options = {
          key: data.razorpayKey,
          subscription_id: data.razorpaySubscription.id,
          name: "Swrk™",
          description: `Subscribe to ${data.subscription.plan.displayName}`,
          handler: function (response: any) {
            setSwitchConfirmation({
              show: false,
              fromPlan: null,
              toPlan: null,
            })
            fetchUserSubscription().then(() => {
              setShowConfirmation(true)
            })
          },
          ondismiss: () => {
            toast.info("Payment was cancelled.")
          },
          prefill: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          theme: {
            color: "#000000",
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create subscription")
      }
    } catch (error) {
      console.error("Error subscribing:", error)
      toast.error("Failed to create subscription")
    } finally {
      setSubscribing(null)
    }
  }

  const isCurrentPlan = (planId: string): boolean => {
    if (!userSubscription) return false
    if (["active", "created"].includes(userSubscription.status)) {
      return userSubscription.plan._id === planId
    }
    return false
  }

  const isFreeCurrentPlan = (): boolean => {
    return (
      !userSubscription ||
      ["active", "created"].includes(userSubscription.status) === false ||
      userSubscription.cancelAtPeriodEnd
    )
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      })

      if (response.ok) {
        toast.success(
          "Subscription will be canceled at the end of the billing period",
        )
        fetchUserSubscription()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast.error("Failed to cancel subscription")
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reactivate" }),
      })

      if (response.ok) {
        toast.success("Subscription reactivated successfully")
        fetchUserSubscription()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to reactivate subscription")
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error)
      toast.error("Failed to reactivate subscription")
    }
  }

  const handleDowngradeToFree = async () => {
    try {
      const response = await fetch("/api/subscriptions/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Subscription canceled")
        // Refresh subscription state; if canceled, fetch will return null or canceled status
        await fetchUserSubscription()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to downgrade to free")
      }
    } catch (error) {
      console.error("Error downgrading:", error)
      toast.error("Failed to downgrade to free")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, text: "Active" },
      canceled: { variant: "destructive" as const, text: "Canceled" },
      past_due: { variant: "destructive" as const, text: "Past Due" },
      trialing: { variant: "secondary" as const, text: "Trial" },
      incomplete: { variant: "outline" as const, text: "Incomplete" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      text: status,
    }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getDiscountedPrice = (plan: SubscriptionPlan) => {
    if (plan.interval === "year") {
      // Find the corresponding monthly plan for discount calculation
      const monthly = plans.find(
        (p) => p.name === plan.name && p.interval === "month",
      )
      if (monthly) {
        // 12 months * monthly price, then 15% off
        const fullYear = monthly.price * 12
        return Math.round(fullYear * 0.85)
      }
    }
    return plan.price
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20 lg:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              <Crown className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary flex-shrink-0" />
              <span>Premium Plans</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
              Choose Your
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                Perfect Plan
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-lg text-muted-foreground px-2 sm:px-0 leading-relaxed">
              Unlock premium features and supercharge your career matching
              experience. Start free and upgrade as you grow.
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        </div>
      </section>

      <section className="pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border bg-background/70 backdrop-blur overflow-hidden">
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium transition",
                  interval === "month"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => setInterval("month")}
              >
                Monthly
              </button>
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium transition",
                  interval === "year"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                onClick={() => setInterval("year")}
              >
                Yearly{" "}
                <span className="ml-1 text-xs font-semibold text-green-600">
                  15% off
                </span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            {plans.filter((plan) => plan.interval === interval).length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12 text-sm sm:text-base">
                No {interval === "year" ? "yearly" : "monthly"} plans available.
              </div>
            ) : (
              plans
                .filter((plan) => plan.interval === interval)
                .map((plan, index) => (
                  <Card
                    key={plan._id}
                    className={cn(
                      "relative !overflow-visible rounded-4xl border-foreground/10 h-full border",
                      "supports-[backdrop-filter]:bg-background/10 backdrop-blur flex flex-col",
                      plan.name === "pro" &&
                        "border-primary/50 shadow-lg shadow-primary/5",
                    )}
                  >
                    {plan.name === "pro" && (
                      <div className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 z-50">
                        <Badge className="bg-primary text-primary-foreground shadow-lg text-xs sm:text-sm">
                          <SparklesIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {plan.displayName.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
                          ₹
                          {plan.interval === "year"
                            ? getDiscountedPrice(plan)
                            : plan.price}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          /{plan.interval === "month" ? "mo" : "yr"}
                        </span>
                        {plan.interval === "year" && (
                          <span className="ml-2 text-xs font-semibold text-green-600">
                            15% off
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-2 sm:mt-3 text-center text-xs sm:text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-6 flex-1 flex flex-col">
                      {/* Benefits Grid */}
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        {plan.benefits.priorityMatching && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">Priority Matching</span>
                          </div>
                        )}
                        {plan.benefits.unlimitedSwipes && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <Zap className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">Unlimited Swipes</span>
                          </div>
                        )}
                        {plan.benefits.advancedFilters && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">Advanced Filters</span>
                          </div>
                        )}
                        {plan.benefits.profileBoost > 0 && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <Crown className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">
                              {plan.benefits.profileBoost} Boosts/mo
                            </span>
                          </div>
                        )}
                        {plan.benefits.analytics && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <Activity className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">Analytics</span>
                          </div>
                        )}
                        {plan.benefits.premiumSupport && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <div className="bg-primary/10 rounded-full p-0.5 sm:p-1 flex-shrink-0">
                              <MessageCircle className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-primary" />
                            </div>
                            <span className="text-xs">Premium Support</span>
                          </div>
                        )}
                      </div>

                      {/* Features List */}
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">
                          Everything you get:
                        </h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm"
                            >
                              <div className="bg-primary text-primary-foreground rounded-full p-0.5 flex-shrink-0 mt-0.5">
                                <Check className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                              </div>
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4 sm:pt-5 md:pt-6 px-4 sm:px-6 pb-4 sm:pb-6 mt-auto">
                      {isCurrentPlan(plan._id) ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full text-xs sm:text-sm"
                        >
                          <Link href="/settings/subscription">Manage</Link>
                        </Button>
                      ) : (
                        <Button
                          className={cn(
                            "w-full text-xs sm:text-sm",
                            plan.name === "pro" &&
                              "bg-primary hover:bg-primary/90",
                          )}
                          onClick={() => handleSubscribe(plan._id)}
                          disabled={subscribing === plan._id}
                          variant={plan.name === "pro" ? "default" : "outline"}
                          size="sm"
                        >
                          {subscribing === plan._id ? (
                            <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin mr-2" />
                          ) : null}
                          <span className="hidden sm:inline">
                            {`Subscribe to ${plan.displayName}`}
                          </span>
                          <span className="sm:hidden">Subscribe</span>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
            )}
          </div>
          <Card className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 border-foreground/10 supports-[backdrop-filter]:bg-background/10 backdrop-blur col-span-1 sm:col-span-2 lg:col-span-1">
            <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Badge variant="secondary" className="text-xs">
                  FREE PLAN
                </Badge>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
                  ₹0
                </span>
                <span className="text-muted-foreground text-xs sm:text-sm">
                  /mo
                </span>
              </div>
              <CardDescription className="mt-2 sm:mt-3 text-center text-xs sm:text-sm">
                Get started with basic features and upgrade anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">
                  Everything you get:
                </h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </div>
                    <span className="leading-snug">Basic profile creation</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </div>
                    <span className="leading-snug">Limited daily swipes</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </div>
                    <span className="leading-snug">
                      Basic matching algorithm
                    </span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </div>
                    <span className="leading-snug">Email notifications</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="pt-4 sm:pt-5 md:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <Button
                variant="outline"
                className="w-full text-xs sm:text-sm"
                disabled={isFreeCurrentPlan()}
                size="sm"
                onClick={() => setShowDowngradeDialog(true)}
              >
                {isFreeCurrentPlan() ? "Current Plan" : "Downgrade to Free"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 text-lg sm:text-xl">
              <Check className="h-5 sm:h-6 w-5 sm:w-6" />
              Subscription Activated!
            </DialogTitle>
            <DialogDescription className="text-sm">
              Your premium subscription has been successfully activated. Welcome
              to the premium experience!
            </DialogDescription>
          </DialogHeader>

          {userSubscription && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base text-green-800">
                    {userSubscription.plan.displayName}
                  </span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-green-700">
                  <p>
                    Amount: ₹{userSubscription.amount}/
                    {userSubscription.plan.interval}
                  </p>
                  <p>
                    Next billing:{" "}
                    {new Date(
                      userSubscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    Status:{" "}
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 text-xs"
                    >
                      Active
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-xs sm:text-sm">
                  Your Premium Benefits:
                </h4>
                <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Priority matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Unlimited swipes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Advanced filters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Profile boost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Analytics dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-500 flex-shrink-0" />
                    <span>Premium support</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              Continue Browsing
            </Button>
            <Button
              onClick={() => router.push("/settings")}
              className="w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              Manage Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={switchConfirmation.show}
        onOpenChange={(open) => {
          if (!open) {
            setSwitchConfirmation({
              show: false,
              fromPlan: null,
              toPlan: null,
            })
          }
        }}
      >
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Switch Subscription Plan?
            </DialogTitle>
            <DialogDescription className="text-sm">
              You're about to switch from{" "}
              {switchConfirmation.fromPlan?.displayName} to{" "}
              {switchConfirmation.toPlan?.displayName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {switchConfirmation.fromPlan &&
              switchConfirmation.toPlan &&
              switchConfirmation.fromPlan.price >
                switchConfirmation.toPlan.price && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-green-800">
                    You'll receive a credit of ₹
                    {Math.round(
                      (switchConfirmation.fromPlan.price -
                        switchConfirmation.toPlan.price) /
                        30,
                    )}
                    /day for the downgrade
                  </p>
                </div>
              )}
            {switchConfirmation.fromPlan &&
              switchConfirmation.toPlan &&
              switchConfirmation.fromPlan.price <
                switchConfirmation.toPlan.price && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-amber-800">
                    Additional charge of ₹
                    {Math.round(
                      (switchConfirmation.toPlan.price -
                        switchConfirmation.fromPlan.price) /
                        30,
                    )}
                    /day will be added to your next bill
                  </p>
                </div>
              )}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-medium">
                  {switchConfirmation.fromPlan?.displayName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Plan:</span>
                <span className="font-medium">
                  {switchConfirmation.toPlan?.displayName}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSwitchConfirmation({
                  show: false,
                  fromPlan: null,
                  toPlan: null,
                })
              }}
              className="text-xs sm:text-sm"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                proceedWithSubscription(switchConfirmation.toPlan?._id || "")
                setSwitchConfirmation({
                  show: false,
                  fromPlan: null,
                  toPlan: null,
                })
              }}
              disabled={subscribing !== null}
              className="text-xs sm:text-sm"
              size="sm"
            >
              {subscribing ? (
                <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin mr-2" />
              ) : null}
              Confirm Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Confirm downgrade to Free?
            </DialogTitle>
            <DialogDescription className="text-sm">
              Downgrading will remove premium features from your account. You
              can cancel now to switch to the Free plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {userSubscription ? (
              <div className="bg-background/50 border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium">
                      {userSubscription.plan.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next billing:{" "}
                      {new Date(
                        userSubscription.currentPeriodEnd,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm">
                    {getStatusBadge(userSubscription.status)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">You will lose these premium features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {userSubscription.plan.benefits.priorityMatching && (
                      <li>Priority matching</li>
                    )}
                    {userSubscription.plan.benefits.unlimitedSwipes && (
                      <li>Unlimited swipes</li>
                    )}
                    {userSubscription.plan.benefits.advancedFilters && (
                      <li>Advanced filters</li>
                    )}
                    {userSubscription.plan.benefits.profileBoost > 0 && (
                      <li>
                        {userSubscription.plan.benefits.profileBoost} boosts per
                        month
                      </li>
                    )}
                    {userSubscription.plan.benefits.analytics && (
                      <li>Analytics dashboard</li>
                    )}
                    {userSubscription.plan.benefits.premiumSupport && (
                      <li>Premium support</li>
                    )}
                  </ul>
                </div>

                {userSubscription.status === "active" && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                    This subscription is active. Cancellation will be scheduled
                    at the end of the current billing period.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                You are not currently subscribed to a premium plan.
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDowngradeDialog(false)}
              className="text-xs sm:text-sm"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowDowngradeDialog(false)
                await handleDowngradeToFree()
              }}
              className="text-xs sm:text-sm"
              size="sm"
            >
              Confirm Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
