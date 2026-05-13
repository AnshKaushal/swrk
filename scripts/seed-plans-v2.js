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

const employeePlans = [
  {
    name: "free",
    displayName: "Free",
    description: "Start connecting with professionals",
    price: 0,
    currency: "INR",
    userType: "employee",
  },
  {
    name: "basic",
    displayName: "Basic",
    description: "Boost your professional profile",
    price: 399,
    currency: "INR",
    userType: "employee",
  },
  {
    name: "pro",
    displayName: "Professional",
    description: "Maximum reach and priority matching",
    price: 999,
    currency: "INR",
    userType: "employee",
  },
]

const employeePlanMeta = {
  free: {
    features: [
      "20 swipes per day",
      "Basic profile visibility",
      "Limited job recommendations",
      "Email notifications",
    ],
    benefits: {
      dailySwipesLimit: 20,
      reachLevel: "basic",
      priorityMatching: false,
      analytics: false,
      profileBoost: 0,
    },
  },
  basic: {
    features: [
      "50 swipes per day",
      "Enhanced profile visibility",
      "Priority in matching",
      "2 profile boosts per month",
      "Standard reach to employers",
      "Basic analytics",
    ],
    benefits: {
      dailySwipesLimit: 50,
      reachLevel: "standard",
      priorityMatching: true,
      analytics: true,
      profileBoost: 2,
    },
  },
  pro: {
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
    benefits: {
      dailySwipesLimit: 999999,
      reachLevel: "premium",
      priorityMatching: true,
      analytics: true,
      profileBoost: 5,
      premiumSupport: true,
      earlyAccess: true,
    },
  },
}

const employerPlans = [
  {
    name: "free",
    displayName: "Starter",
    description: "Post jobs and find talent",
    price: 0,
    currency: "INR",
    userType: "employer",
  },
  {
    name: "growth",
    displayName: "Growth",
    description: "Scale your hiring efforts",
    price: 2999,
    currency: "INR",
    userType: "employer",
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Full power for large-scale hiring",
    price: 9999,
    currency: "INR",
    userType: "employer",
  },
]

const employerPlanMeta = {
  free: {
    features: [
      "5 job posts per month",
      "View candidate profiles",
      "100 candidate likes per month",
      "Basic candidate filtering",
      "Email notifications",
    ],
    benefits: {
      jobPostsLimit: 5,
      candidateLikesLimit: 100,
      advancedFilters: false,
      analytics: false,
    },
  },
  growth: {
    features: [
      "20 job posts per month",
      "Unlimited candidate profile views",
      "500 candidate likes per month",
      "Advanced filtering options",
      "Team member support (up to 3)",
      "Candidate analytics",
      "Priority candidate matching",
    ],
    benefits: {
      jobPostsLimit: 20,
      candidateLikesLimit: 500,
      advancedFilters: true,
      analytics: true,
      priorityMatching: true,
    },
  },
  enterprise: {
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
    benefits: {
      jobPostsLimit: 0,
      candidateLikesLimit: 0,
      advancedFilters: true,
      analytics: true,
      priorityMatching: true,
      premiumSupport: true,
      earlyAccess: true,
    },
  },
}

const bothPlans = [
  {
    name: "free",
    displayName: "Free",
    description: "Experience both roles with basic features",
    price: 0,
    currency: "INR",
    userType: "both",
  },
  {
    name: "dual-basic",
    displayName: "Dual Basic",
    description: "Both employee & employer with basic features",
    price: 699,
    currency: "INR",
    userType: "both",
  },
  {
    name: "dual-pro",
    displayName: "Dual Professional",
    description: "Both roles with premium features",
    price: 1699,
    currency: "INR",
    userType: "both",
  },
]

const bothPlanMeta = {
  free: {
    features: [
      "Employee: 20 swipes/day",
      "Employer: 5 job posts + 100 candidate likes/month",
      "Basic profile visibility",
      "Email notifications",
    ],
    benefits: {
      dailySwipesLimit: 20,
      profileBoost: 0,
      jobPostsLimit: 5,
      candidateLikesLimit: 100,
      priorityMatching: false,
      analytics: false,
      reachLevel: "basic",
    },
  },
  "dual-basic": {
    features: [
      "Employee: 50 swipes/day + 2 boosts/month",
      "Employer: 10 job posts + 200 candidate likes/month",
      "Priority matching on both sides",
      "Standard analytics dashboard",
      "Basic support",
    ],
    benefits: {
      dailySwipesLimit: 50,
      profileBoost: 2,
      jobPostsLimit: 10,
      candidateLikesLimit: 200,
      priorityMatching: true,
      analytics: true,
      reachLevel: "standard",
    },
  },
  "dual-pro": {
    features: [
      "Employee: Unlimited swipes + 5 boosts/month",
      "Employer: Unlimited job posts + unlimited candidate likes",
      "Premium priority matching on both sides",
      "Advanced analytics for both roles",
      "Premium support",
      "Early access to features",
    ],
    benefits: {
      dailySwipesLimit: 999999,
      profileBoost: 5,
      jobPostsLimit: 0,
      candidateLikesLimit: 0,
      priorityMatching: true,
      analytics: true,
      premiumSupport: true,
      earlyAccess: true,
      reachLevel: "premium",
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
  if (price === 0) {
    return `free-plan-${Date.now()}`
  }

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
    {
      name: planData.name,
      userType: planData.userType,
      interval: planData.interval,
    },
    { $set: planData },
    { upsert: true, new: true },
  )
}

async function createPlansForType(plansArray, plansMeta, userType) {
  console.log(`\n📋 Creating ${userType} plans...`)

  for (const base of plansArray) {
    const meta = plansMeta[base.name]

    // ===== MONTHLY =====
    let monthly = await SubscriptionPlan.findOne({
      name: base.name,
      userType: base.userType,
      interval: "month",
    })

    if (!monthly) {
      console.log(`➡️ Creating monthly: ${base.name} (${userType})`)

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

      console.log(`✔ Monthly created: ${base.name} (${userType})`)
    } else {
      console.log(`⏩ Monthly exists: ${base.name} (${userType})`)
    }

    // ===== YEARLY =====
    const yearlyPrice = Math.round(base.price * 12 * 0.85)

    let yearly = await SubscriptionPlan.findOne({
      name: base.name,
      userType: base.userType,
      interval: "year",
    })

    if (!yearly) {
      console.log(`➡️ Creating yearly: ${base.name} (${userType})`)

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

      console.log(`✔ Yearly created: ${base.name} (${userType})`)
    } else {
      console.log(`⏩ Yearly exists: ${base.name} (${userType})`)
    }
  }
}

async function createAllPlans() {
  try {
    await connectDB()
    console.log("✅ Connected to DB")

    await createPlansForType(employeePlans, employeePlanMeta, "employee")
    await createPlansForType(employerPlans, employerPlanMeta, "employer")
    await createPlansForType(bothPlans, bothPlanMeta, "both")

    console.log("\n🎉 All plans ready!")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

createAllPlans()
