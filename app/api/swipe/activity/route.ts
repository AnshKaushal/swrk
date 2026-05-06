import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { Swipe } from "@/models/swipe"
import mongoose from "mongoose"

function getStartDate(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (days - 1))
  return d
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const range = parseInt(url.searchParams.get("range") || "7", 10)
    const type = url.searchParams.get("type") || "given" // given | received

    await db()

    const start = getStartDate(range)

    const match: any = {
      direction: { $in: ["right", "super"] },
      createdAt: { $gte: start },
    }

    if (type === "given") {
      match.swipedBy = new mongoose.Types.ObjectId(session.user.id)
    } else {
      match.swipedOn = new mongoose.Types.ObjectId(session.user.id)
    }

    const agg = await Swipe.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Build full range with zeros where missing
    const results: { day: string; value: number }[] = []
    for (let i = 0; i < range; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = formatDateISO(d)
      const found = agg.find((a) => a._id === key)
      results.push({ day: key, value: found ? found.count : 0 })
    }

    return NextResponse.json({ range, type, data: results })
  } catch (err) {
    console.error("[api/swipe/activity GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    )
  }
}
