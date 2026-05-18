import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PositionSwipe from "@/models/position-swipe"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const excludeIds = searchParams.getAll("excludeId")

    const query: any = {
      status: "active",
      isVisible: true,
    }

    // Exclude already swiped positions
    if (excludeIds.length > 0) {
      const validIds = excludeIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id))

      const swipedPositions = await PositionSwipe.find({
        candidateId: session.user.id,
        positionId: { $in: validIds },
      }).select("positionId")

      const swipedIds = swipedPositions.map((s) => s.positionId)
      query._id = { $nin: swipedIds }
    }

    const positions = await Position.find(query)
      .populate("employerId", "name avatar companyName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ positions })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    )
  }
}
