import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { emitToMatch, emitToUser, getSocketServer } from "@/lib/socket-server"
import Interview from "@/models/interview"
import { Match, Swipe } from "@/models/swipe"
import Message from "@/models/message"
import Notification from "@/models/notification"

function buildMessagePreview(content: string) {
  return content.trim().replace(/\s+/g, " ").slice(0, 120)
}

function extractObjectId(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "")
  }
  return String(value)
}

function getParticipantMatch(userId: string, matchId: string) {
  return Match.findOne({
    _id: matchId,
    $or: [{ employer: userId }, { employee: userId }],
  })
}

function getConversationSideState(
  match: {
    employer?: { _id?: unknown } | unknown
    employee?: { _id?: unknown } | unknown
    clearedAtByEmployer?: string | Date | null
    clearedAtByEmployee?: string | Date | null
    deletedAtByEmployer?: string | Date | null
    deletedAtByEmployee?: string | Date | null
  },
  userId: string,
) {
  const isEmployer = extractObjectId(match.employer) === userId

  const clearCursor = isEmployer
    ? match.clearedAtByEmployer
    : match.clearedAtByEmployee
  const deletedCursor = isEmployer
    ? match.deletedAtByEmployer
    : match.deletedAtByEmployee
  const hiddenField = isEmployer ? "deletedAtByEmployer" : "deletedAtByEmployee"

  return {
    isEmployer,
    clearCursor,
    deletedCursor,
    hiddenField,
    hiddenByUserId: userId,
  }
}

function getMostRecentCursor(
  ...values: Array<string | Date | null | undefined>
) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : 0))
    .filter((value) => value > 0)

  if (!timestamps.length) return undefined

  return new Date(Math.max(...timestamps))
}

async function reactivateDeletedConversation(
  matchId: string,
  userId: string,
  side: ReturnType<typeof getConversationSideState>,
) {
  if (!side.deletedCursor) return

  await Match.updateOne(
    { _id: matchId },
    {
      $unset: {
        [side.hiddenField!]: 1,
        lastMessagePreview: 1,
        lastMessageAt: 1,
      },
      $pull: { hiddenBy: userId },
    },
  )
}

async function isMutualMatch(match: {
  employer?: { _id?: unknown } | unknown
  employee?: { _id?: unknown } | unknown
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

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const matchId = searchParams.get("matchId")

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 })
    }

    const match = await getParticipantMatch(session.user.id, matchId)
      .populate(
        "employer",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .populate(
        "employee",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .select(
        "employer employee hiddenBy status clearedAtByEmployer clearedAtByEmployee",
      )
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

    const side = getConversationSideState(match, session.user.id)
    const historyCursor = getMostRecentCursor(
      side.clearCursor,
      side.deletedCursor,
    )

    const messageQuery: Record<string, unknown> = { match: matchId }
    if (historyCursor) {
      messageQuery.createdAt = { $gt: historyCursor }
    }

    const messages = await Message.find(messageQuery)
      .populate("sender", "name avatar username role activeRole")
      .sort({ createdAt: 1 })
      .lean()

    const interviewIds = messages
      .filter((message) => message.type === "interview" && message.interviewId)
      .map((message) => String(message.interviewId))

    const interviews = interviewIds.length
      ? await Interview.find({ _id: { $in: interviewIds } })
          .select(
            "status deniedReason confirmedAt deniedAt scheduledFor timezone duration title description interviewLink createdBy employer employee",
          )
          .lean()
      : []

    const interviewMap = new Map(
      interviews.map((interview) => [String(interview._id), interview]),
    )

    const messagesWithInterviews = messages.map((message) => ({
      ...message,
      interview:
        message.type === "interview" && message.interviewId
          ? interviewMap.get(String(message.interviewId)) || null
          : null,
    }))

    await Message.updateMany(
      {
        match: matchId,
        sender: { $ne: session.user.id },
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
      { _id: matchId },
      side.isEmployer
        ? { $set: { unreadByEmployer: 0 } }
        : { $set: { unreadByEmployee: 0 } },
    )

    if (side.deletedCursor) {
      await reactivateDeletedConversation(matchId, session.user.id, side)
      if (side.isEmployer) {
        match.deletedAtByEmployer = undefined
      } else {
        match.deletedAtByEmployee = undefined
      }
      match.lastMessagePreview = undefined
      match.lastMessageAt = undefined
      const hiddenBy = Array.isArray(
        (match as { hiddenBy?: string[] }).hiddenBy,
      )
        ? (match as { hiddenBy?: string[] }).hiddenBy!.filter(
            (hiddenUserId) => String(hiddenUserId) !== session.user.id,
          )
        : undefined
      if (hiddenBy) {
        ;(match as { hiddenBy?: string[] }).hiddenBy = hiddenBy
      }
    }

    return NextResponse.json({
      match,
      messages: messagesWithInterviews,
    })
  } catch (err) {
    console.error("[api/messages GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const body = await req.json()
    const matchId = String(body.matchId || "").trim()
    const type = String(body.type || "text").trim()
    const rawContent = String(body.content || "").trim()
    const attachmentUrl = String(body.attachmentUrl || "").trim()
    const attachmentName = String(body.attachmentName || "").trim()
    const attachmentType = String(body.attachmentType || "").trim()
    const content =
      rawContent || attachmentName || attachmentUrl || "Attachment"

    if (!matchId || (!rawContent && !attachmentUrl)) {
      return NextResponse.json(
        { error: "Missing matchId or content" },
        { status: 400 },
      )
    }

    const messageType = ["cv-share", "linkedin", "starter", "system"].includes(
      type,
    )
      ? type
      : "text"

    const match = await getParticipantMatch(session.user.id, matchId)
      .populate(
        "employer",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .populate(
        "employee",
        "name avatar username email role activeRole isOnline lastSeen",
      )
      .select(
        "employer employee hiddenBy status clearedAtByEmployer clearedAtByEmployee",
      )

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    const side = getConversationSideState(match, session.user.id)
    const senderIsEmployer = side.isEmployer
    const senderRole = senderIsEmployer ? "employer" : "employee"
    const recipientId = senderIsEmployer
      ? extractObjectId(match.employee)
      : extractObjectId(match.employer)

    if (side.deletedCursor) {
      await reactivateDeletedConversation(matchId, session.user.id, side)
    }

    const message = await Message.create({
      match: matchId,
      sender: session.user.id,
      senderRole,
      type: messageType,
      content,
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      attachmentType: attachmentType || undefined,
    })

    await Match.updateOne(
      { _id: matchId },
      senderIsEmployer
        ? {
            $set: {
              lastMessageAt: message.createdAt,
              lastMessagePreview: buildMessagePreview(content),
              lastMessageBy: session.user.id,
            },
            $inc: { unreadByEmployee: 1 },
            $pull: { hiddenBy: recipientId },
          }
        : {
            $set: {
              lastMessageAt: message.createdAt,
              lastMessagePreview: buildMessagePreview(content),
              lastMessageBy: session.user.id,
            },
            $inc: { unreadByEmployer: 1 },
            $pull: { hiddenBy: recipientId },
          },
    )

    const [populatedMessage, updatedMatch] = await Promise.all([
      Message.findById(message._id)
        .populate("sender", "name avatar username role activeRole")
        .lean(),
      Match.findById(matchId)
        .populate("employer", "name avatar username email role activeRole")
        .populate("employee", "name avatar username email role activeRole")
        .lean(),
    ])

    if (getSocketServer()) {
      emitToMatch(matchId, "message:new", {
        matchId,
        message: populatedMessage,
      })

      emitToUser(extractObjectId(match.employer), "conversation:update", {
        matchId,
        match: updatedMatch,
      })

      emitToUser(extractObjectId(match.employee), "conversation:update", {
        matchId,
        match: updatedMatch,
      })
    }

    return NextResponse.json({
      message: populatedMessage,
      match: updatedMatch,
    })
  } catch (err) {
    console.error("[api/messages POST]", err)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    )
  }
}
