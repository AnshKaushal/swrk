import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { Swipe, Match } from "@/models/swipe"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const likesGiven = await Swipe.countDocuments({
      swipedBy: session.user.id,
      direction: { $in: ["right", "super"] },
    })

    const likesReceived = await Swipe.countDocuments({
      swipedOn: session.user.id,
      direction: { $in: ["right", "super"] },
    })

    const matchesCount = await Match.countDocuments({
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status: "active",
    })

    const recentMatches = await Match.find({
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status: "active",
    })
      .sort({ matchedAt: -1 })
      .limit(5)
      .populate("employer", "name avatar")
      .populate("employee", "name avatar")
      .lean()

    return NextResponse.json({
      likesGiven,
      likesReceived,
      matchesCount,
      recentMatches,
    })
  } catch (err) {
    console.error("[api/swipe/stats GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    )
  }
}
