"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Crown, Check } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Subscription {
  _id: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  amount: number
  interval: string
  credit: number
  balanceDue: number
  plan: {
    displayName: string
    price: number
    interval: string
  }
}

export default function SubscriptionSettingsPage() {
  const { status: sessionStatus } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchSubscription()
    }
  }, [sessionStatus])

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/manage")
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/subscriptions/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })

      if (response.ok) {
        toast.success(
          "Subscription will be canceled at the end of the billing period",
        )
        fetchSubscription()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast.error("Failed to cancel subscription")
    } finally {
      setSaving(false)
    }
  }

  const handleReactivate = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/subscriptions/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      })

      if (response.ok) {
        toast.success("Subscription reactivated successfully")
        fetchSubscription()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to reactivate subscription")
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error)
      toast.error("Failed to reactivate subscription")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {subscription ? (
        <>
          <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h2 className="text-base/7 font-semibold">Your Subscription</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Manage your premium subscription and billing.
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="flex items-start justify-between rounded-lg border border-border p-4">
                <div className="flex items-start gap-4">
                  <Crown className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold">
                      {subscription.plan.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Badge
                        variant={
                          ["active", "created"].includes(subscription.status)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.status === "created"
                          ? "active"
                          : subscription.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ₹{subscription.amount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription.interval === "month" ? "mo" : "yr"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Next billing:{" "}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Benefits</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Priority matching
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Unlimited swipes
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Advanced filters
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Profile boost
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Analytics dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    Premium support
                  </li>
                </ul>
              </div>

              {subscription.credit > 0 && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Account credit:{" "}
                    <span className="font-semibold">
                      ₹{subscription.credit}
                    </span>
                  </p>
                </div>
              )}

              {subscription.balanceDue > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Amount due:{" "}
                    <span className="font-semibold">
                      ₹{subscription.balanceDue}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {subscription.cancelAtPeriodEnd ? (
                  <Button onClick={handleReactivate} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel Subscription
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/subscription">View All Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Subscription</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              No active subscription.
            </p>
          </div>
          <div className="md:col-span-2 text-center py-8">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-2">
              No Active Subscription
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Upgrade to premium to unlock all features and benefits.
            </p>
            <Button asChild>
              <Link href="/subscription">Explore Plans</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
