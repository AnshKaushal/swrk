import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { emitToMatch, emitToUser, getSocketServer } from "@/lib/socket-server"
import Message from "@/models/message"
import Notification from "@/models/notification"
import { Match, Swipe } from "@/models/swipe"
import User from "@/models/user"

function extractObjectId(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "")
  }
  return String(value)
}

async function isMutualMatch(match: {
  employer?: unknown
  employee?: unknown
}) {
  const employerId = extractObjectId(match.employer)
  const employeeId = extractObjectId(match.employee)

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

  return Boolean(employerSwipe && employeeSwipe)
}

function getConversationSide(
  match: { employer?: unknown; employee?: unknown },
  userId: string,
) {
  return String(extractObjectId(match.employer)) === userId
    ? "employer"
    : "employee"
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || "").trim()
    const reason = String(body?.reason || "").trim()
    const description = String(body?.description || "").trim()

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    const match = await Match.findOne({
      _id: id,
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status: "active",
      hiddenBy: { $ne: session.user.id },
    })
      .select("employer employee hiddenBy status")
      .lean()

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    const currentUserId = session.user.id
    const isEmployer = getConversationSide(match, currentUserId) === "employer"
    const otherUserId = isEmployer
      ? extractObjectId(match.employee)
      : extractObjectId(match.employer)

    if (action === "mark-read") {
      await Message.updateMany(
        {
          match: id,
          sender: { $ne: currentUserId },
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      )

      await Match.updateOne(
        { _id: id },
        isEmployer
          ? { $set: { unreadByEmployer: 0 } }
          : { $set: { unreadByEmployee: 0 } },
      )
    } else if (action === "mark-unread") {
      const unreadCount = await Message.countDocuments({
        match: id,
        sender: { $ne: currentUserId },
      })

      await Message.updateMany(
        {
          match: id,
          sender: { $ne: currentUserId },
        },
        {
          $set: {
            isRead: false,
            readAt: null,
          },
        },
      )

      await Match.updateOne(
        { _id: id },
        isEmployer
          ? { $set: { unreadByEmployer: unreadCount } }
          : { $set: { unreadByEmployee: unreadCount } },
      )
    } else if (action === "delete") {
      await Match.updateOne(
        { _id: id },
        { $addToSet: { hiddenBy: currentUserId } },
      )
    } else if (action === "report") {
      const reportedUser = await User.findById(otherUserId)
        .select("name username")
        .lean()

      if (!reportedUser) {
        return NextResponse.json(
          { error: "Reported user not found" },
          { status: 404 },
        )
      }

      const reporter = await User.findById(currentUserId)
        .select("name username")
        .lean()

      const reportReason = reason || "chat"
      const reportDescription = description || ""

      await User.updateOne(
        { _id: otherUserId },
        {
          $inc: { reportCount: 1 },
          $push: {
            reports: {
              reportedBy: currentUserId,
              reason: reportReason,
              description: reportDescription,
              createdAt: new Date(),
              status: "pending",
            },
          },
        },
      )

      const admins = await User.find({ isAdmin: true })
        .select("_id name username")
        .lean()

      await Promise.all(
        admins.map((admin) =>
          Notification.create({
            user: admin._id,
            actor: currentUserId,
            type: "report",
            status: "pending",
            title: "New chat report",
            message: `${reporter?.name || reporter?.username || "A user"} reported ${reportedUser.name || reportedUser.username || "another user"}.`,
            link: "/dashboard",
            data: {
              matchId: id,
              reportedUserId: otherUserId,
              reporterUserId: currentUserId,
              reason: reportReason,
              description: reportDescription,
            },
          }),
        ),
      )

      if (getSocketServer()) {
        for (const admin of admins) {
          emitToUser(String(admin._id), "notification:new", {
            type: "report",
            title: "New chat report",
            message: `${reporter?.name || reporter?.username || "A user"} reported ${reportedUser.name || reportedUser.username || "another user"}.`,
            link: "/dashboard",
            matchId: id,
          })
        }
      }

      return NextResponse.json({
        ok: true,
        action,
        reportedUserId: otherUserId,
      })
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const updatedMatch = await Match.findById(id)
      .populate(
        "employer",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .populate(
        "employee",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .lean()

    if (action !== "delete" && getSocketServer()) {
      emitToMatch(id, "conversation:update", {
        matchId: id,
        match: updatedMatch,
      })

      emitToUser(extractObjectId(match.employer), "conversation:update", {
        matchId: id,
        match: updatedMatch,
      })

      emitToUser(extractObjectId(match.employee), "conversation:update", {
        matchId: id,
        match: updatedMatch,
      })
    }

    return NextResponse.json({
      ok: true,
      action,
      match: updatedMatch,
    })
  } catch (error) {
    console.error("[api/matches/[id]/actions POST]", error)
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 },
    )
  }
}
