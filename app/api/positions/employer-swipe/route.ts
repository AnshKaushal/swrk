import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import EmployerPositionSwipe from "@/models/employer-position-swipe"
import PositionMatch from "@/models/position-match"
import PositionSwipe from "@/models/position-swipe"
import Position from "@/models/position"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { positionId, candidateId, direction } = await req.json()

    if (!positionId || !candidateId || !direction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    if (!["left", "right"].includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
    }

    const position = await Position.findById(positionId)
      .select("employerId")
      .lean()
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (String(position.employerId) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if employer already swiped on this candidate for this position
    const existingSwipe = await EmployerPositionSwipe.findOne({
      employerId: session.user.id,
      positionId,
      candidateId,
    })

    if (existingSwipe) {
      return NextResponse.json(
        { error: "Already swiped on this candidate" },
        { status: 400 },
      )
    }

    const swipe = new EmployerPositionSwipe({
      employerId: session.user.id,
      positionId,
      candidateId,
      direction,
    })

    await swipe.save()

    // Check if candidate has already swiped right on this position
    if (direction === "right") {
      const candidateSwipe = await PositionSwipe.findOne({
        candidateId,
        positionId,
        direction: "right",
      })

      if (candidateSwipe) {
        const existingMatch = await PositionMatch.findOne({
          candidateId,
          employerId: session.user.id,
          positionId,
        })

        if (!existingMatch) {
          const match = new PositionMatch({
            candidateId,
            employerId: session.user.id,
            positionId,
            status: "matched",
          })
          await match.save()

          // Increment match count
          await Position.updateOne(
            { _id: positionId },
            { $inc: { matchCount: 1 } },
          )

          return NextResponse.json({
            success: true,
            matched: true,
            matchId: match._id,
          })
        }
      }
    }

    return NextResponse.json({ success: true, matched: false })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to process swipe" },
      { status: 500 },
    )
  }
}
