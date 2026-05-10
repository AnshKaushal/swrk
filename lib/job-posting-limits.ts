import SubscriptionPlan from "@/models/subscription-plan"
import UserSubscription from "@/models/user-subscription"
import User from "@/models/user"
import Position from "@/models/position"

export type JobPostQuota = {
  allowed: boolean
  used: number
  remaining: number | null
  limit: number | null
  isUnlimited: boolean
  planName: string
}

async function resolveUserPlan(userId: string): Promise<{
  planName: string
  jobPostsLimit: number
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
      benefits?: { jobPostsLimit?: number }
    }

    return {
      planName: plan.displayName || plan.name || "free",
      jobPostsLimit: plan.benefits?.jobPostsLimit ?? 0,
    }
  }

  const user = await User.findById(userId).select("premiumPlan").lean()
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
      jobPostsLimit: planDoc?.benefits?.jobPostsLimit ?? 0,
    }
  }

  return {
    planName: "free",
    jobPostsLimit: 3,
  }
}

export async function getJobPostQuota(userId: string): Promise<JobPostQuota> {
  const { planName, jobPostsLimit } = await resolveUserPlan(userId)

  if (jobPostsLimit === 0) {
    return {
      allowed: true,
      used: 0,
      remaining: null,
      limit: null,
      isUnlimited: true,
      planName,
    }
  }

  const used = await Position.countDocuments({
    employerId: userId,
    status: { $ne: "deleted" },
  })

  const remaining = Math.max(0, jobPostsLimit - used)

  return {
    allowed: remaining > 0,
    used,
    remaining,
    limit: jobPostsLimit,
    isUnlimited: false,
    planName,
  }
}
