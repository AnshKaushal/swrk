import SubscriptionPlan from "@/models/subscription-plan"
import { Swipe } from "@/models/swipe"
import UserSubscription from "@/models/user-subscription"
import User from "@/models/user"

type SwipeQuota = {
  allowed: boolean
  used: number
  remaining: number | null
  limit: number | null
  resetAt: Date | null
  isUnlimited: boolean
  planName: string
}

const WINDOW_MS = 24 * 60 * 60 * 1000

function getLimitFromPlanName(planName: string): number {
  const normalized = planName.toLowerCase()

  if (normalized === "basic") {
    return Number(process.env.SWIPE_BASIC_DAILY_LIMIT ?? 150)
  }

  if (normalized === "pro") {
    return Number(process.env.SWIPE_PRO_DAILY_LIMIT ?? 300)
  }

  if (normalized === "enterprise") {
    return Number(process.env.SWIPE_ENTERPRISE_DAILY_LIMIT ?? 1000)
  }

  return Number(process.env.SWIPE_FREE_DAILY_LIMIT ?? 20)
}

async function resolveUserPlan(userId: string): Promise<{
  planName: string
  isUnlimited: boolean
}> {
  const activeSubscription = await UserSubscription.findOne({
    user: userId,
    status: {
      $in: [
        "active",
        "created",
        "trialing",
        "pending",
        "authentication_pending",
      ],
    },
  })
    .sort({ createdAt: -1 })
    .populate("plan", "name displayName benefits")
    .lean()

  if (activeSubscription?.plan) {
    const plan = activeSubscription.plan as {
      name?: string
      displayName?: string
      benefits?: { unlimitedSwipes?: boolean }
    }

    return {
      planName: plan.displayName || plan.name || "free",
      isUnlimited: plan.benefits?.unlimitedSwipes === true,
    }
  }

  const user = await User.findById(userId)
    .select("premiumPlan isPremium")
    .lean()
  const fallbackPlan = user?.premiumPlan || "free"

  if (fallbackPlan !== "free") {
    const planDoc = await SubscriptionPlan.findOne({
      name: fallbackPlan,
      isActive: true,
    })
      .sort({ interval: 1 })
      .select("benefits displayName")
      .lean()

    return {
      planName: (planDoc as any)?.displayName || fallbackPlan,
      isUnlimited: planDoc?.benefits?.unlimitedSwipes === true,
    }
  }

  return {
    planName: "free",
    isUnlimited: false,
  }
}

export async function getSwipeQuota(userId: string): Promise<SwipeQuota> {
  const { planName, isUnlimited } = await resolveUserPlan(userId)

  if (isUnlimited) {
    return {
      allowed: true,
      used: 0,
      remaining: null,
      limit: null,
      resetAt: null,
      isUnlimited: true,
      planName,
    }
  }

  const limit = getLimitFromPlanName(planName)
  const windowStart = new Date(Date.now() - WINDOW_MS)

  const used = await Swipe.countDocuments({
    swipedBy: userId,
    createdAt: { $gte: windowStart },
  })

  const remaining = Math.max(0, limit - used)
  const allowed = used < limit

  let resetAt: Date | null = null

  if (used > 0) {
    const oldestSwipeInWindow = await Swipe.findOne({
      swipedBy: userId,
      createdAt: { $gte: windowStart },
    })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean()

    if (oldestSwipeInWindow?.createdAt) {
      resetAt = new Date(
        new Date(oldestSwipeInWindow.createdAt).getTime() + WINDOW_MS,
      )
    }
  }

  return {
    allowed,
    used,
    remaining,
    limit,
    resetAt,
    isUnlimited: false,
    planName,
  }
}

// Monthly super-like quotas per plan
export async function getSuperQuota(userId: string) {
  // mapping as requested
  const planMap: Record<string, number> = {
    free: Number(process.env.SUPER_FREE ?? 5),
    basic: Number(process.env.SUPER_BASIC ?? 15),
    pro: Number(process.env.SUPER_PRO ?? 50),
    enterprise: Number(process.env.SUPER_ENTERPRISE ?? 100),
  }

  const { planName, isUnlimited } = await resolveUserPlan(userId)
  const normalized = (planName || "").toLowerCase()

  if (isUnlimited) {
    return {
      allowed: true,
      used: 0,
      remaining: null,
      limit: null,
      resetAt: null,
      isUnlimited: true,
      planName,
    }
  }

  const limit = planMap[normalized] ?? planMap.free

  const windowStart = new Date()
  windowStart.setUTCDate(1)
  windowStart.setUTCHours(0, 0, 0, 0)

  const used = await Swipe.countDocuments({
    swipedBy: userId,
    direction: "super",
    createdAt: { $gte: windowStart },
  })

  const remaining = Math.max(0, limit - used)
  const allowed = used < limit

  // reset at next month start
  const next = new Date(windowStart)
  next.setUTCMonth(next.getUTCMonth() + 1)

  return {
    allowed,
    used,
    remaining,
    limit,
    resetAt: next,
    isUnlimited: false,
    planName,
  }
}
