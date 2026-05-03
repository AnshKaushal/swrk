import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import {
  getAIRankedCandidates,
  getHeuristicCandidates,
} from "@/lib/recommendation-service"
import { Swipe } from "@/models/swipe"
import User from "@/models/user"

const AI_MIN_SWIPES = Number(process.env.SWIPE_AI_MIN_SWIPES ?? 25)

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

    const [swipedProfiles, swipeCount] = await Promise.all([
      Swipe.find({ swipedBy: session.user.id }).select("swipedOn").lean(),
      Swipe.countDocuments({ swipedBy: session.user.id }),
    ])

    const excludeIds = Array.from(
      new Set([
        ...swipedProfiles.map((s) => String(s.swipedOn)),
        ...manualExcludeIds,
      ]),
    )

    const useAi = swipeCount >= AI_MIN_SWIPES

    const candidates = useAi
      ? await getAIRankedCandidates(session.user.id, excludeIds, limit)
      : await getHeuristicCandidates(
          session.user.id,
          viewerRole,
          excludeIds,
          limit,
        )

    const filtered = candidates.filter((c) => {
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

    return NextResponse.json({
      candidates: filtered,
      total: filtered.length,
      swipeCount,
      rankingMode: useAi ? "ai" : "heuristic",
      aiThreshold: AI_MIN_SWIPES,
    })
  } catch (err) {
    console.error("[api/swipe/candidates GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 },
    )
  }
}
