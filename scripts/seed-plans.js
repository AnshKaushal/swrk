import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import mongoose from "mongoose"
import Razorpay from "razorpay"

import SubscriptionPlan from "../models/subscription-plan.ts"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local")
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  return mongoose.connect(MONGODB_URI)
}

const subscriptionPlans = [
  {
    name: "basic",
    displayName: "Basic",
    description: "Perfect for getting started with professional networking",
    price: 499,
    currency: "INR",
  },
  {
    name: "pro",
    displayName: "Professional",
    description: "Advanced features for serious career advancement",
    price: 999,
    currency: "INR",
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Complete solution for enterprise-level networking",
    price: 1999,
    currency: "INR",
  },
]

const planMeta = {
  basic: {
    features: [
      "Priority matching algorithm",
      "Unlimited swipes and matches",
      "Advanced filtering options",
      "Profile boost (2 per month)",
      "Basic analytics dashboard",
      "10 job posts per month",
    ],
    benefits: {
      priorityMatching: true,
      unlimitedSwipes: true,
      advancedFilters: true,
      profileBoost: 2,
      analytics: true,
      premiumSupport: false,
      hideAds: false,
      earlyAccess: false,
      jobPostsLimit: 10,
    },
  },
  pro: {
    features: [
      "Everything in Basic plan",
      "Premium support",
      "Ad-free experience",
      "Early access to new features",
      "Profile boost (5 per month)",
      "Advanced analytics and insights",
      "Unlimited job posts",
    ],
    benefits: {
      priorityMatching: true,
      unlimitedSwipes: true,
      advancedFilters: true,
      profileBoost: 5,
      analytics: true,
      premiumSupport: true,
      hideAds: true,
      earlyAccess: true,
      jobPostsLimit: 0,
    },
  },
  enterprise: {
    features: [
      "Everything in Professional plan",
      "White-label solution",
      "Custom integrations",
      "Dedicated account manager",
      "Advanced reporting",
      "Priority phone support",
      "Unlimited job posts",
    ],
    benefits: {
      priorityMatching: true,
      unlimitedSwipes: true,
      advancedFilters: true,
      profileBoost: 10,
      analytics: true,
      premiumSupport: true,
      hideAds: true,
      earlyAccess: true,
      jobPostsLimit: 0,
    },
  },
}

async function createRazorpayPlan({
  displayName,
  description,
  price,
  currency,
  interval,
}) {
  const plan = await razorpay.plans.create({
    period: interval === "month" ? "monthly" : "yearly",
    interval: 1,
    item: {
      name: `${displayName} (${interval})`,
      amount: price * 100,
      currency,
      description,
    },
  })

  return plan.id
}

async function upsertPlan(planData) {
  return SubscriptionPlan.findOneAndUpdate(
    { name: planData.name, interval: planData.interval },
    { $set: planData },
    { upsert: true, new: true },
  )
}

async function createPlans() {
  try {
    await connectDB()
    console.log("✅ Connected to DB")

    for (const base of subscriptionPlans) {
      const meta = planMeta[base.name]

      // ===== MONTHLY =====
      let monthly = await SubscriptionPlan.findOne({
        name: base.name,
        interval: "month",
      })

      if (!monthly) {
        console.log(`➡️ Creating monthly: ${base.name}`)

        const razorpayPlanId = await createRazorpayPlan({
          ...base,
          interval: "month",
        })

        await upsertPlan({
          ...base,
          ...meta,
          interval: "month",
          razorpayPlanId,
          isActive: true,
          sortOrder: 1,
        })

        console.log(`✔ Monthly created: ${base.name}`)
      } else {
        console.log(`⏩ Monthly exists: ${base.name}`)
      }

      // ===== YEARLY =====
      const yearlyPrice = Math.round(base.price * 12 * 0.85)

      let yearly = await SubscriptionPlan.findOne({
        name: base.name,
        interval: "year",
      })

      if (!yearly) {
        console.log(`➡️ Creating yearly: ${base.name}`)

        const razorpayPlanId = await createRazorpayPlan({
          ...base,
          price: yearlyPrice,
          interval: "year",
        })

        await upsertPlan({
          ...base,
          ...meta,
          price: yearlyPrice,
          interval: "year",
          razorpayPlanId,
          isActive: true,
          sortOrder: 100,
        })

        console.log(`✔ Yearly created: ${base.name}`)
      } else {
        console.log(`⏩ Yearly exists: ${base.name}`)
      }
    }

    console.log("🎉 All plans ready")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

createPlans()
