import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import UserSubscription from "@/models/user-subscription"
import User from "@/models/user"
import transporter from "@/lib/mailer"
import { subscriptionConfirmationTemplate } from "@/emails/subscriptionConfirmationTemplate"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 },
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    await db()

    console.log("Razorpay webhook event:", event.event)

    switch (event.event) {
      case "subscription.activated":
        await handleSubscriptionActivated(event.payload.subscription)
        break

      case "subscription.charged":
        await handleSubscriptionCharged(event.payload.subscription)
        break

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event.payload.subscription)
        break

      case "subscription.completed":
        await handleSubscriptionCompleted(event.payload.subscription)
        break

      case "subscription.paused":
        await handleSubscriptionPaused(event.payload.subscription)
        break

      case "subscription.resumed":
        await handleSubscriptionResumed(event.payload.subscription)
        break

      case "subscription.pending":
        await handleSubscriptionPending(event.payload.subscription)
        break

      case "subscription.halted":
        await handleSubscriptionHalted(event.payload.subscription)
        break

      default:
        console.log("Unhandled webhook event:", event.event)
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    )
  }
}

async function handleSubscriptionActivated(subscription: any) {
  try {
    // Update subscription status
    const updatedSubscription = await UserSubscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscription.id },
      {
        status: "active",
        razorpayCustomerId: subscription.customer_id,
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000),
        nextPaymentDate: new Date(subscription.charge_at * 1000),
      },
      { returnDocument: "after" },
    ).populate("user plan")

    if (updatedSubscription) {
      // Get user details for email
      const user = await User.findById(updatedSubscription.user)
      if (user && user.email) {
        const nextBillingDate = new Date(
          subscription.current_end * 1000,
        ).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        // Send confirmation email
        await transporter.sendMail({
          from: `"SWRK" <${process.env.BREVO_SMTP_USER}>`,
          to: user.email,
          subject: "🎉 Your SWRK Premium Subscription is Now Active!",
          html: subscriptionConfirmationTemplate(
            user.name || user.username || "Valued User",
            updatedSubscription.plan.displayName,
            updatedSubscription.amount,
            nextBillingDate,
          ),
        })

        console.log(`Confirmation email sent to ${user.email}`)
      }
    }
  } catch (error) {
    console.error("Error handling subscription activation:", error)
  }
}

async function handleSubscriptionCharged(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "active",
      lastPaymentDate: new Date(),
      nextPaymentDate: new Date(subscription.charge_at * 1000),
      failedPaymentCount: 0, // Reset failed payment count
    },
  )
}

async function handleSubscriptionCancelled(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "canceled",
      canceledAt: new Date(),
      endedAt: new Date(subscription.ended_at * 1000),
    },
  )
}

async function handleSubscriptionCompleted(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "completed",
      endedAt: new Date(subscription.ended_at * 1000),
    },
  )
}

async function handleSubscriptionPaused(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "paused",
    },
  )
}

async function handleSubscriptionResumed(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "active",
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  )
}

async function handleSubscriptionPending(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "pending",
    },
  )
}

async function handleSubscriptionHalted(subscription: any) {
  await UserSubscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      status: "halted",
      failedPaymentCount: subscription.failed_payment_count || 0,
    },
  )
}
