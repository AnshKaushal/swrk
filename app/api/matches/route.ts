import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { Match, Swipe } from "@/models/swipe"
import User from "@/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "active"
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const skip = Math.max(parseInt(searchParams.get("skip") || "0"), 0)

    const query: Record<string, unknown> = {
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status,
      hiddenBy: { $ne: session.user.id },
    }

    const matches = await Match.find(query)
      .sort({ lastMessageAt: -1, matchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employer", "name avatar email username isOnline lastSeen")
      .populate("employee", "name avatar email username isOnline lastSeen")
      .lean()

    const mutualMatches = [] as typeof matches
    for (const match of matches) {
      const employerId = String(match.employer?._id ?? match.employer)
      const employeeId = String(match.employee?._id ?? match.employee)
      const [employerSwipe, employeeSwipe] = await Promise.all([
        Swipe.findOne({
          swipedBy: employerId,
          swipedOn: employeeId,
          direction: { $in: ["right", "super"] },
        })
          .select("_id")
          .lean(),
        Swipe.findOne({
          swipedBy: employeeId,
          swipedOn: employerId,
          direction: { $in: ["right", "super"] },
        })
          .select("_id")
          .lean(),
      ])

      if (employerSwipe && employeeSwipe) {
        mutualMatches.push(match)
      }
    }

    const total = mutualMatches.length

    return NextResponse.json({
      matches: mutualMatches,
      total,
      limit,
      skip,
    })
  } catch (err) {
    console.error("[api/matches GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    )
  }
}
