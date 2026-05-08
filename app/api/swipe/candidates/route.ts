import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { getSwipeQuota } from "@/lib/swipe-limits"
import {
  getAIRankedCandidates,
  getHeuristicCandidates,
} from "@/lib/recommendation-service"
import { Swipe } from "@/models/swipe"
import User from "@/models/user"

const USE_AI_RANKING = process.env.SWIPE_USE_AI_RANKING === "true"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const manualExcludeIds = searchParams
      .getAll("excludeId")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean)

    const user = await User.findById(session.user.id).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const viewerRole = user.activeRole || user.role || "employee"

    const [swipedProfiles, swipeCount, quota] = await Promise.all([
      Swipe.find({ swipedBy: session.user.id }).select("swipedOn").lean(),
      Swipe.countDocuments({ swipedBy: session.user.id }),
      getSwipeQuota(session.user.id),
    ])

    const excludeIds = Array.from(
      new Set([
        ...swipedProfiles.map((s) => String(s.swipedOn)),
        ...manualExcludeIds,
      ]),
    )

    const useAi = USE_AI_RANKING

    const candidates = useAi
      ? await getAIRankedCandidates(session.user.id, excludeIds, limit)
      : await getHeuristicCandidates(
          session.user.id,
          viewerRole,
          excludeIds,
          limit,
        )

    // Fetch viewer profile to compute match percentage
    let viewerProfile: any = null
    if (viewerRole === "employer") {
      const EmployerProfile = (await import("@/models/employer")).default
      viewerProfile = await EmployerProfile.findOne({ user: user._id }).lean()
    } else {
      const EmployeeProfile = (await import("@/models/employee")).default
      viewerProfile = await EmployeeProfile.findOne({ user: user._id }).lean()
    }

    const filtered = candidates
      .filter((c) => {
        const visibility = c.profileVisibility || "public"
        if (visibility === "hidden") return false
        if (
          visibility === "verified-only" &&
          !c.isVerified &&
          !c.profileVerified
        ) {
          return false
        }
        return true
      })
      .map((c) => {
        // compute match percent and expose job requirements
        const candidate = { ...c } as any

        function computePercent(
          jobSkills: string[] = [],
          personSkills: string[] = [],
        ) {
          const a = (jobSkills || []).map((s) => String(s).toLowerCase())
          const b = (personSkills || []).map((s) => String(s).toLowerCase())
          if (a.length > 0) {
            const matched = a.filter((s) => b.includes(s)).length
            return Math.round((matched / a.length) * 100)
          }
          // fallback: Jaccard-like
          const set = new Set<string>([...a, ...b])
          const intersect = a.filter((s) => b.includes(s)).length
          const denom = set.size || 1
          return Math.round((intersect / denom) * 100)
        }

        let jobSkills: string[] = []
        let personSkills: string[] = []

        if (viewerRole === "employer") {
          // viewer is employer, candidates are employees
          jobSkills =
            (viewerProfile?.activeOpenings &&
              viewerProfile.activeOpenings[0]?.requiredSkills) ||
            viewerProfile?.filters?.skills ||
            []
          personSkills = candidate.primarySkills || candidate.skills || []
        } else {
          // viewer is employee, candidates are employers
          jobSkills =
            (candidate.activeOpenings &&
              candidate.activeOpenings[0]?.requiredSkills) ||
            candidate.filters?.skills ||
            []
          // viewer's own skills
          personSkills =
            viewerProfile?.primarySkills || viewerProfile?.skills || []
        }

        candidate.matchPercent = computePercent(jobSkills, personSkills)
        candidate.jobRequirements = jobSkills
        candidate.personSkills = personSkills

        return candidate
      })
    // Determine which of these candidates have already liked the viewer
    const candidateIds = filtered.map((c: any) => c._id).filter(Boolean)
    let likedMap: Record<string, { direction: string }> = {}
    if (candidateIds.length > 0) {
      const likes = await Swipe.find({
        swipedBy: { $in: candidateIds },
        swipedOn: session.user.id,
        direction: { $in: ["right", "super"] },
      })
        .select("swipedBy direction")
        .lean()

      likedMap = likes.reduce((acc: any, l: any) => {
        acc[String(l.swipedBy)] = { direction: l.direction }
        return acc
      }, {})
    }

    const enriched = filtered.map((c: any) => ({
      ...c,
      likedYou: Boolean(likedMap[String(c._id)]),
      likedType: likedMap[String(c._id)]?.direction || null,
    }))

    return NextResponse.json({
      candidates: enriched,
      total: enriched.length,
      swipeCount,
      rankingMode: useAi ? "ai" : "heuristic",
      swipeQuota: {
        remaining: quota.remaining,
        limit: quota.limit,
        plan: quota.planName,
        isUnlimited: quota.isUnlimited,
        resetAt: quota.resetAt,
      },
    })
  } catch (err) {
    console.error("[api/swipe/candidates GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 },
    )
  }
}
