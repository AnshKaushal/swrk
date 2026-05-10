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
      .select("employer employee hiddenBy status")
      .lean()

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (
      (match.hiddenBy || []).some(
        (userId: unknown) => String(userId) === session.user.id,
      )
    ) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    const messages = await Message.find({ match: matchId })
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

    const isEmployer = extractObjectId(match.employer) === session.user.id
    await Match.updateOne(
      { _id: matchId },
      isEmployer
        ? { $set: { unreadByEmployer: 0 } }
        : { $set: { unreadByEmployee: 0 } },
    )

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
      .select("employer employee hiddenBy status")

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (
      (match.hiddenBy || []).some(
        (userId: unknown) => String(userId) === session.user.id,
      )
    ) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    const senderIsEmployer = extractObjectId(match.employer) === session.user.id
    const senderRole = senderIsEmployer ? "employer" : "employee"
    const recipientId = senderIsEmployer
      ? extractObjectId(match.employee)
      : extractObjectId(match.employer)
    const senderName = senderIsEmployer
      ? (match.employer as { name?: string } | undefined)?.name || "Someone"
      : (match.employee as { name?: string } | undefined)?.name || "Someone"

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
          }
        : {
            $set: {
              lastMessageAt: message.createdAt,
              lastMessagePreview: buildMessagePreview(content),
              lastMessageBy: session.user.id,
            },
            $inc: { unreadByEmployer: 1 },
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
    }

    if (getSocketServer()) {
      emitToUser(extractObjectId(match.employer), "conversation:update", {
        matchId,
        match: updatedMatch,
      })

      emitToUser(extractObjectId(match.employee), "conversation:update", {
        matchId,
        match: updatedMatch,
      })
    }

    void Notification.create({
      user: recipientId,
      actor: session.user.id,
      type: "message",
      title: "New message",
      message: `${senderName} sent you a message.`,
      link: `/dashboard/messages?matchId=${matchId}`,
      data: { matchId, messageId: message._id },
    }).catch((error) => {
      console.error("[api/messages notification]", error)
    })

    if (getSocketServer()) {
      emitToUser(recipientId, "notification:new", {
        type: "message",
        title: "New message",
        message: `${senderName} sent you a message.`,
        link: `/dashboard/messages?matchId=${matchId}`,
        matchId,
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
