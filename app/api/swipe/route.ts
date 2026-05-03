import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { checkRateLimit } from "@/lib/rate-limiter"
import { Swipe, Match } from "@/models/swipe"
import User from "@/models/user"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { targetId, direction } = await req.json()

    if (!targetId || !direction) {
      return NextResponse.json(
        { error: "Missing targetId or direction" },
        { status: 400 },
      )
    }

    if (!["left", "right", "super"].includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
    }

    if (targetId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot swipe on yourself" },
        { status: 400 },
      )
    }

    const rateLimit = await checkRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      ) 
    }

    let target = null
    try {
      target = await User.findById(targetId)
    } catch (e) {
      console.error(e)
    }

    if (!target) {
      target = await User.findOne({ username: targetId })
    }
    if (!target) {
      target = await User.findOne({ email: targetId })
    }

    if (!target) {
      const isValidObjectId = (await import("mongoose")).default.isValidObjectId
      const valid = isValidObjectId(targetId)

      const devDetails = {
        targetIdLength: String(targetId).length,
        validObjectId: valid,
      }

      const body =
        process.env.NODE_ENV === "production"
          ? { error: "Target user not found" }
          : { error: "Target user not found", details: devDetails }

      return NextResponse.json(body, { status: 404 })
    }

    const targetUserId = new mongoose.Types.ObjectId(target._id)

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let swipe = await Swipe.findOne({
      swipedBy: session.user.id,
      swipedOn: targetUserId,
    })

    if (swipe) {
      swipe.direction = direction
      swipe.createdMatch = false
      swipe.matchId = null
    } else {
      swipe = new Swipe({
        swipedBy: session.user.id,
        swipedByRole: user.activeRole || user.role,
        swipedOn: targetUserId,
        swipedOnRole: target.activeRole || target.role,
        direction,
      })
    }

    await swipe.save()

    let matched = false
    let match = null

    if (direction === "right") {
      const reciprocalSwipe = await Swipe.findOne({
        swipedBy: targetUserId,
        swipedOn: session.user.id,
        direction: { $in: ["right", "super"] },
      })

      if (reciprocalSwipe) {
        const existingMatch = await Match.findOne({
          $or: [
            { employer: session.user.id, employee: targetUserId },
            { employer: targetUserId, employee: session.user.id },
          ],
        })

        if (!existingMatch) {
          const isUserEmployer =
            user.activeRole === "employer" || user.role === "employer"
          const employerId = isUserEmployer ? session.user.id : targetUserId
          const employeeId = isUserEmployer ? targetUserId : session.user.id

          match = new Match({
            employer: employerId,
            employee: employeeId,
            matchedAt: new Date(),
          })

          await match.save()
          matched = true

          swipe.createdMatch = true
          swipe.matchId = match._id
          await swipe.save()

          reciprocalSwipe.createdMatch = true
          reciprocalSwipe.matchId = match._id
          await reciprocalSwipe.save()
        }
      }
    }

    return NextResponse.json({
      success: true,
      matched,
      match: match?.toObject() || null,
      remaining: rateLimit.remaining - 1,
    })
  } catch (err) {
    console.error("[api/swipe POST]", err)
    return NextResponse.json(
      { error: "Failed to create swipe" },
      { status: 500 },
    )
  }
}
