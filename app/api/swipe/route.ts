import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { getSwipeQuota } from "@/lib/swipe-limits"
import { Swipe, Match } from "@/models/swipe"
import User from "@/models/user"
import Notification from "@/models/notification"
import { emitToUser, getSocketServer } from "@/lib/socket-server"
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

    const quota = await getSwipeQuota(session.user.id)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Daily swipe limit reached",
          resetAt: quota.resetAt,
          remaining: quota.remaining,
          limit: quota.limit,
          plan: quota.planName,
          isUnlimited: quota.isUnlimited,
        },
        { status: 429 },
      )
    }

    // If this is a super swipe, enforce monthly super-like quotas
    if (direction === "super") {
      const { getSuperQuota } = await import("@/lib/swipe-limits")
      const superQuota = await getSuperQuota(session.user.id)
      if (!superQuota.allowed) {
        return NextResponse.json(
          {
            error: "Super like limit reached",
            remaining: superQuota.remaining,
            limit: superQuota.limit,
            resetAt: superQuota.resetAt,
            plan: superQuota.planName,
            isUnlimited: superQuota.isUnlimited,
          },
          { status: 429 },
        )
      }
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
    // Create basic notifications for the target user about the action
    try {
      const notifType =
        direction === "super"
          ? "super_like"
          : direction === "right"
            ? "like"
            : "pass"
      const notificationTitle =
        direction === "super"
          ? "You received a Super Like"
          : direction === "right"
            ? "Someone liked you"
            : "Profile viewed"
      const notificationMessage =
        direction === "super"
          ? `${user.name || "Someone"} Super Liked you!`
          : direction === "right"
            ? `${user.name || "Someone"} liked you!`
            : `${user.name || "Someone"} interacted with your profile.`

      await Notification.create({
        user: targetUserId,
        actor: session.user.id,
        type: notifType,
        title: notificationTitle,
        message: notificationMessage,
        link: `/${user.username || user._id}`,
        data: { swipeId: swipe._id },
      })

      if (getSocketServer()) {
        emitToUser(targetUserId.toString(), "notification:new", {
          type: notifType,
          title: notificationTitle,
          message: notificationMessage,
          link: `/${user.username || user._id}`,
          swipeId: swipe._id,
        })
      }
    } catch (e) {
      console.warn("failed to create notification", e)
    }

    return NextResponse.json({
      success: true,
      matched,
      match: match?.toObject() || null,
      remaining:
        quota.isUnlimited || quota.remaining === null
          ? null
          : Math.max(0, quota.remaining - 1),
      limit: quota.limit,
      plan: quota.planName,
      isUnlimited: quota.isUnlimited,
    })
  } catch (err) {
    console.error("[api/swipe POST]", err)
    return NextResponse.json(
      { error: "Failed to create swipe" },
      { status: 500 },
    )
  }
}
