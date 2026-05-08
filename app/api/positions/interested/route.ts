import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import PositionSwipe from "@/models/position-swipe"
import EmployerPositionSwipe from "@/models/employer-position-swipe"
import User from "@/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const positionId = searchParams.get("positionId")
    const limit = parseInt(searchParams.get("limit") || "30")
    const excludeIds = searchParams.getAll("excludeId") || []

    if (!positionId) {
      return NextResponse.json(
        { error: "positionId required" },
        { status: 400 },
      )
    }

    // Get all candidates who swiped right on this position
    const query: any = {
      positionId,
      direction: "right",
    }

    if (excludeIds.length > 0) {
      query.candidateId = { $nin: excludeIds }
    }

    const swipes = await PositionSwipe.find(query)
      .select("candidateId")
      .limit(limit)
      .lean()

    const candidateIds = swipes.map((s) => s.candidateId)

    // Get candidate profiles with details
    const candidates = await User.find({ _id: { $in: candidateIds } })
      .select(
        "name username avatar headline bio currentCity currentCountry preferredLocations desiredRoles employmentType",
      )
      .lean()

    // Check which candidates this employer has already swiped on
    const employerSwipes = await EmployerPositionSwipe.find({
      employerId: session.user.id,
      positionId,
      candidateId: { $in: candidateIds },
    }).lean()

    const swiped = new Set(employerSwipes.map((s) => s.candidateId.toString()))

    const enrichedCandidates = candidates.map((candidate) => ({
      ...candidate,
      alreadySwiped: swiped.has(candidate._id.toString()),
    }))

    return NextResponse.json({ candidates: enrichedCandidates })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch interested candidates" },
      { status: 500 },
    )
  }
}
