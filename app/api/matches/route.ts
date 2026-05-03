import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { Match } from "@/models/swipe"
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
    }

    const matches = await Match.find(query)
      .sort({ lastMessageAt: -1, matchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employer", "name avatar email username")
      .populate("employee", "name avatar email username")
      .lean()

    const total = await Match.countDocuments(query)

    return NextResponse.json({
      matches,
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
