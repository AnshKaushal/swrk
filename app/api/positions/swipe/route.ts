import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import PositionSwipe from "@/models/position-swipe"
import EmployerPositionSwipe from "@/models/employer-position-swipe"
import PositionMatch from "@/models/position-match"
import Position from "@/models/position"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const body = await req.json()
    const positionId = String(body.positionId || "").trim()
    const direction = String(body.direction || "").trim()
    const applicationData =
      body.applicationData && typeof body.applicationData === "object"
        ? body.applicationData
        : {}

    if (!positionId || !direction) {
      return NextResponse.json(
        { error: "Missing positionId or direction" },
        { status: 400 },
      )
    }

    if (!["left", "right"].includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
    }

    const position = await Position.findById(positionId)
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (String(position.employerId) === session.user.id) {
      return NextResponse.json(
        { error: "Cannot swipe on your own position" },
        { status: 400 },
      )
    }

    // Check if user already swiped on this position
    const existingSwipe = await PositionSwipe.findOne({
      candidateId: session.user.id,
      positionId,
    })

    if (existingSwipe) {
      return NextResponse.json(
        { error: "Already swiped on this position" },
        { status: 400 },
      )
    }

    const swipe = new PositionSwipe({
      candidateId: session.user.id,
      positionId,
      employerId: position.employerId,
      direction,
      applicationData,
      applicationStatus: direction === "right" ? "submitted" : undefined,
      applicationSubmittedAt:
        direction === "right" && Object.keys(applicationData).length > 0
          ? new Date()
          : undefined,
      applicationStatusUpdatedAt:
        direction === "right" ? new Date() : undefined,
    })

    await swipe.save()

    // Check if employer has already swiped right on this candidate
    if (direction === "right") {
      const employerSwipe = await EmployerPositionSwipe.findOne({
        employerId: position.employerId,
        candidateId: session.user.id,
        positionId,
        direction: "right",
      })

      if (employerSwipe) {
        const existingMatch = await PositionMatch.findOne({
          candidateId: session.user.id,
          employerId: position.employerId,
          positionId,
        })

        if (!existingMatch) {
          const match = new PositionMatch({
            candidateId: session.user.id,
            employerId: position.employerId,
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
