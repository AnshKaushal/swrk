import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import UserSubscription from "@/models/user-subscription"
import SubscriptionPlan from "@/models/subscription-plan"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const subscription = await UserSubscription.findOne({
      user: session.user.id,
    })
      .populate("plan")
      .select("-razorpaySubscriptionId -razorpayCustomerId")

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching user subscription:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 },
      )
    }

    await db()

    const existingSubscription = await UserSubscription.findOne({
      user: session.user.id,
    })
      .populate("plan")
      .lean()

    const plan = await SubscriptionPlan.findById(planId)
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // If switching plans and user has an active subscription, compute proration
    let proration = {
      credit: 0,
      charge: 0,
    }

    if (
      existingSubscription &&
      existingSubscription._id &&
      existingSubscription.status === "active" &&
      String(existingSubscription.plan._id) !== String(planId)
    ) {
      try {
        const now = new Date()
        const periodStart = existingSubscription.currentPeriodStart
          ? new Date(existingSubscription.currentPeriodStart)
          : null
        const periodEnd = existingSubscription.currentPeriodEnd
          ? new Date(existingSubscription.currentPeriodEnd)
          : null

        if (periodStart && periodEnd && periodEnd > now) {
          const msInDay = 1000 * 60 * 60 * 24
          const periodDays = Math.max(
            Math.round((periodEnd.getTime() - periodStart.getTime()) / msInDay),
            1,
          )
          const remainingDays = Math.max(
            Math.round((periodEnd.getTime() - now.getTime()) / msInDay),
            0,
          )

          const oldPrice = existingSubscription.amount || 0
          const newPrice = plan.price || 0

          const perDayOld = oldPrice / periodDays
          const perDayNew = newPrice / periodDays

          const diffPerDay = perDayOld - perDayNew
          const prorated = Math.round(diffPerDay * remainingDays)

          if (prorated > 0) {
            // User is downgrading — give credit
            proration.credit = prorated
          } else if (prorated < 0) {
            // User is upgrading — record charge due
            proration.charge = Math.abs(prorated)
          }
        }
      } catch (e) {
        console.warn("Proration calculation failed:", e)
      }
    }

    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,
      start_at: Math.floor(Date.now() / 1000) + 86400,
      expire_by: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
      addons: [],
      notes: {
        userId: session.user.id,
        planName: plan.name,
      },
    })

    let userSubscription

    if (existingSubscription && existingSubscription._id) {
      // Update existing subscription
      // Apply proration adjustments
      const update: any = {
        plan: planId,
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayCustomerId: razorpaySubscription.customer_id || null,
        status: razorpaySubscription.status,
        currentPeriodStart: razorpaySubscription.current_start
          ? new Date(razorpaySubscription.current_start * 1000)
          : new Date(),
        currentPeriodEnd: razorpaySubscription.current_end
          ? new Date(razorpaySubscription.current_end * 1000)
          : new Date(),
        amount: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        nextPaymentDate: razorpaySubscription.charge_at
          ? new Date(razorpaySubscription.charge_at * 1000)
          : new Date(),
        cancelAtPeriodEnd: false,
      }

      if (proration.credit && proration.credit > 0) {
        update.$inc = { credit: proration.credit }
      }

      if (proration.charge && proration.charge > 0) {
        // Record charge due; we'll store it in balanceDue and return to client for collection
        update.$inc = { ...(update.$inc || {}), balanceDue: proration.charge }
      }

      userSubscription = await UserSubscription.findByIdAndUpdate(
        existingSubscription._id,
        update,
        { returnDocument: "after" },
      ).populate("plan")
    } else {
      // Create new subscription
      userSubscription = new UserSubscription({
        user: session.user.id,
        plan: planId,
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayCustomerId: razorpaySubscription.customer_id || null,
        status: razorpaySubscription.status,
        currentPeriodStart: razorpaySubscription.current_start
          ? new Date(razorpaySubscription.current_start * 1000)
          : new Date(),
        currentPeriodEnd: razorpaySubscription.current_end
          ? new Date(razorpaySubscription.current_end * 1000)
          : new Date(),
        amount: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        nextPaymentDate: razorpaySubscription.charge_at
          ? new Date(razorpaySubscription.charge_at * 1000)
          : new Date(),
      })

      await userSubscription.save()
    }

    if (!userSubscription) {
      userSubscription = await UserSubscription.findOne({
        user: session.user.id,
      }).populate("plan")
    }

    return NextResponse.json({
      subscription: userSubscription,
      razorpaySubscription,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await req.json()

    await db()

    const subscription = await UserSubscription.findOne({
      user: session.user.id,
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      )
    }

    if (action === "cancel") {
      try {
        // If subscription is active, attempt to cancel at period end
        if (subscription.status === "active") {
          // Request cancel at cycle end (Razorpay expects numeric flag)
          await razorpay.subscriptions.cancel(
            subscription.razorpaySubscriptionId,
            1,
          )

          subscription.cancelAtPeriodEnd = true
          subscription.canceledAt = new Date()
          await subscription.save()

          return NextResponse.json({
            message:
              "Subscription will be canceled at the end of the billing period",
          })
        }

        // For subscriptions not yet active (created/incomplete), cancel immediately
        try {
          await razorpay.subscriptions.cancel(
            subscription.razorpaySubscriptionId,
          )
        } catch (rzError: any) {
          // If Razorpay rejects cancellation because there is no billing cycle,
          // fall back to marking the subscription canceled locally.
          console.warn(
            "Razorpay cancel error, falling back to local cancel:",
            rzError?.error || rzError,
          )
        }

        subscription.status = "canceled"
        subscription.canceledAt = new Date()
        subscription.endedAt = new Date()
        subscription.cancelAtPeriodEnd = false
        await subscription.save()

        return NextResponse.json({ message: "Subscription canceled" })
      } catch (err: any) {
        console.error("Error cancelling subscription:", err)
        // If Razorpay returned a bad request about no billing cycle, mark canceled locally
        if (
          err?.error?.description &&
          String(err.error.description).includes("no billing cycle")
        ) {
          subscription.status = "canceled"
          subscription.canceledAt = new Date()
          subscription.endedAt = new Date()
          await subscription.save()
          return NextResponse.json({ message: "Subscription canceled locally" })
        }

        throw err
      }
    }

    if (action === "reactivate") {
      // Reactivate subscription
      await razorpay.subscriptions.resume(subscription.razorpaySubscriptionId, {
        resume_at: "now",
      })

      subscription.cancelAtPeriodEnd = false
      subscription.canceledAt = null
      await subscription.save()

      return NextResponse.json({
        message: "Subscription reactivated successfully",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 },
    )
  }
}
