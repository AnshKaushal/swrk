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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit
    const excludeSwiped = searchParams.get("excludeSwiped") !== "false"
    const search = searchParams.get("search")?.trim()

    const query: any = {
      status: "active",
      isVisible: true,
      employerId: { $ne: session.user.id },
    }

    if (search) {
      const regex = { $regex: search, $options: "i" }
      query.$or = [
        { title: regex },
        { description: regex },
        { company: regex },
      ]
    }

    if (excludeSwiped) {
      const swipedPositions = await PositionSwipe.find({
        candidateId: session.user.id,
      }).select("positionId")

      const swipedIds = swipedPositions.map((s) => s.positionId)
      if (swipedIds.length > 0) {
        query._id = { $nin: swipedIds }
      }
    }

    const [positions, total] = await Promise.all([
      Position.find(query)
        .populate("employerId", "name avatar companyName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Position.countDocuments(query),
    ])

    return NextResponse.json({ positions, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    )
  }
}
