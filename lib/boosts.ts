import UserSubscription from "@/models/user-subscription"
import SubscriptionPlan from "@/models/subscription-plan"
import User from "@/models/user"
import BoostUsage from "@/models/boost"

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // month window

async function resolvePlanForBoosts(userId: string) {
  const activeSubscription = await UserSubscription.findOne({
    user: userId,
    status: { $in: ["active", "created", "trialing", "pending"] },
  })
    .sort({ createdAt: -1 })
    .populate("plan", "name displayName benefits")
    .lean()

  if (activeSubscription?.plan) {
    const plan = activeSubscription.plan as any
    return {
      planName: plan.displayName || plan.name || "free",
      profileBoosts: plan.benefits?.profileBoost || 0,
    }
  }

  const user = await User.findById(userId).select("premiumPlan").lean()
  const fallbackPlan = user?.premiumPlan || "free"

  if (fallbackPlan !== "free") {
    const planDoc = await SubscriptionPlan.findOne({
      name: fallbackPlan,
      isActive: true,
    })
      .select("benefits displayName name")
      .lean()
    return {
      planName: (planDoc as any)?.displayName || fallbackPlan,
      profileBoosts: planDoc?.benefits?.profileBoost || 0,
    }
  }

  return { planName: "free", profileBoosts: 0 }
}

export async function getBoostQuota(userId: string) {
  const { planName, profileBoosts } = await resolvePlanForBoosts(userId)

  const windowStart = new Date(Date.now() - WINDOW_MS)
  const used = await BoostUsage.countDocuments({
    user: userId,
    createdAt: { $gte: windowStart },
  })

  const remaining = Math.max(0, (profileBoosts || 0) - used)
  const allowed = used < (profileBoosts || 0)

  let resetAt: Date | null = null
  if (used > 0) {
    const oldest = await BoostUsage.findOne({
      user: userId,
      createdAt: { $gte: windowStart },
    })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean()
    if (oldest?.createdAt) {
      resetAt = new Date(new Date(oldest.createdAt).getTime() + WINDOW_MS)
    }
  }

  return {
    allowed,
    used,
    remaining,
    limit: profileBoosts || 0,
    resetAt,
    planName,
  }
}

export async function useBoost(userId: string) {
  const quota = await getBoostQuota(userId)
  if (!quota.allowed) return { success: false, quota }

  const doc = new BoostUsage({ user: userId })
  await doc.save()

  const updated = await getBoostQuota(userId)
  return { success: true, quota: updated }
}
