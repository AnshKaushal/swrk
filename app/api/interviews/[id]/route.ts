import { auth } from "../../auth/[...nextauth]/route"
import Interview from "@/models/interview"
import Message from "@/models/message"
import { Match } from "@/models/swipe"
import Notification from "@/models/notification"
import { db } from "@/lib/mongodb"
import { NextRequest, NextResponse } from "next/server"
import { emitToUser, getSocketServer } from "@/lib/socket-server"

function buildMessagePreview(content: string) {
  return content.trim().replace(/\s+/g, " ").slice(0, 120)
}

export async function PUT(
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
    const { status, reason } = await req.json()

    if (!["confirmed", "denied"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const interview = await Interview.findById(id)

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      )
    }

    if (
      interview.employee.toString() !== session.user.id &&
      interview.employer.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (status === "confirmed") {
      interview.status = "confirmed"
      interview.confirmedAt = new Date()
    } else if (status === "denied") {
      interview.status = "denied"
      interview.deniedAt = new Date()
      interview.deniedReason = reason || ""
    }

    await interview.save()

    const senderIsEmployer = interview.employer.toString() === session.user.id
    const senderRole = senderIsEmployer ? "employer" : "employee"
    const recipientId = senderIsEmployer
      ? interview.employee.toString()
      : interview.employer.toString()
    const responseContent =
      status === "confirmed"
        ? "confirmed the interview"
        : reason
          ? `declined the interview: ${reason}`
          : "declined the interview"

    const responseMessage = await Message.create({
      match: interview.match,
      sender: session.user.id,
      senderRole,
      type: "interview",
      interviewId: interview._id,
      interviewMessageType: "response",
      content: responseContent,
    })

    await Match.updateOne(
      { _id: interview.match },
      senderIsEmployer
        ? {
            $set: {
              lastMessageAt: responseMessage.createdAt,
              lastMessagePreview: buildMessagePreview(responseContent),
              lastMessageBy: session.user.id,
            },
            $inc: { unreadByEmployee: 1 },
          }
        : {
            $set: {
              lastMessageAt: responseMessage.createdAt,
              lastMessagePreview: buildMessagePreview(responseContent),
              lastMessageBy: session.user.id,
            },
            $inc: { unreadByEmployer: 1 },
          },
    )

    const populatedResponseMessage = await Message.findById(responseMessage._id)
      .populate("sender", "name avatar username role activeRole")
      .lean()

    const notificationTitle =
      status === "confirmed" ? "Interview confirmed" : "Interview declined"
    const notificationMessage =
      status === "confirmed"
        ? "Your interview request has been confirmed."
        : `Your interview request was declined${reason ? `: ${reason}` : ""}.`

    await Notification.create({
      user: recipientId,
      actor: session.user.id,
      type: `interview_${status}`,
      title: notificationTitle,
      message: notificationMessage,
      link: "/dashboard/interviews",
      data: { interviewId: interview._id, status },
    })

    if (getSocketServer()) {
      emitToUser(recipientId, "message:new", {
        matchId: String(interview.match),
        message: {
          ...populatedResponseMessage,
          interview: interview.toObject(),
        },
      })

      emitToUser(recipientId, "conversation:update", {
        matchId: String(interview.match),
      })

      emitToUser(session.user.id, "conversation:update", {
        matchId: String(interview.match),
      })

      emitToUser(session.user.id, "message:new", {
        matchId: String(interview.match),
        message: {
          ...populatedResponseMessage,
          interview: interview.toObject(),
        },
      })

      emitToUser(recipientId, "notification:new", {
        type: `interview_${status}`,
        title: notificationTitle,
        message: notificationMessage,
        link: "/dashboard/interviews",
        interviewId: interview._id,
      })
      emitToUser(recipientId, "interview:update", {
        interviewId: interview._id,
        matchId: String(interview.match),
        status,
      })
    }

    return NextResponse.json({
      interview: interview.toObject(),
      message: populatedResponseMessage,
    })
  } catch (error) {
    console.error("Interview update error:", error)
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 },
    )
  }
}

export async function GET(
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
    const interview = await Interview.findById(id)
      .populate("match")
      .populate("employer", "name avatar companyName")
      .populate("employee", "name avatar headline")

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      )
    }

    if (
      interview.employee.toString() !== session.user.id &&
      interview.employer.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ interview: interview.toObject() })
  } catch (error) {
    console.error("Failed to fetch interview:", error)
    return NextResponse.json(
      { error: "Failed to fetch interview" },
      { status: 500 },
    )
  }
}
