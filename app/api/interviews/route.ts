import { auth } from "../auth/[...nextauth]/route"
import Interview from "@/models/interview"
import { Match, Swipe } from "@/models/swipe"
import Message from "@/models/message"
import Notification from "@/models/notification"
import { db } from "@/lib/mongodb"
import { NextRequest, NextResponse } from "next/server"
import { emitToUser, getSocketServer } from "@/lib/socket-server"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { matchId, title, description, scheduledFor, timezone, duration } =
      await req.json()

    if (!matchId || !title || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const match = await Match.findById(matchId)
      .populate("employer")
      .populate("employee")

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (match.employer._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Only employer can schedule interviews" },
        { status: 403 },
      )
    }

    const googleMeetLink = `https://meet.google.com/${generateMeetCode()}`

    const interview = new Interview({
      match: matchId,
      scheduledFor: new Date(scheduledFor),
      timezone: timezone || "UTC",
      duration: duration || 60,
      title,
      description,
      createdBy: session.user.id,
      interviewLink: googleMeetLink,
      employer: match.employer._id,
      employee: match.employee._id,
      status: "scheduled",
    })

    await interview.save()

    const message = new Message({
      match: matchId,
      sender: session.user.id,
      senderRole: "employer",
      type: "interview",
      interviewId: interview._id,
      content: `Interview scheduled: ${title}`,
    })

    await message.save()

    interview.messageId = message._id
    await interview.save()

    const recipientId = String(match.employee._id)

    await Notification.create({
      user: recipientId,
      actor: session.user.id,
      type: "interview",
      title: "Interview scheduled",
      message: `${match.employer?.name || "An employer"} scheduled an interview.`,
      link: "/dashboard/interviews",
      data: { interviewId: interview._id, matchId },
    })

    if (getSocketServer()) {
      emitToUser(recipientId, "notification:new", {
        type: "interview",
        title: "Interview scheduled",
        message: `${match.employer?.name || "An employer"} scheduled an interview.`,
        link: "/dashboard/interviews",
        interviewId: interview._id,
        matchId,
      })
      emitToUser(recipientId, "conversation:update", {
        matchId,
        interviewId: interview._id,
      })
    }

    return NextResponse.json(
      {
        interview: interview.toObject(),
        message: message.toObject(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Interview creation error:", error)
    return NextResponse.json(
      { error: "Failed to schedule interview" },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const role = searchParams.get("role")

    let query: any = {
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
    }

    if (status) {
      query.status = status
    }

    const interviews = await Interview.find(query)
      .populate("match")
      .populate("employer", "name avatar companyName")
      .populate("employee", "name avatar headline")
      .sort({ scheduledFor: 1 })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error("Failed to fetch interviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 },
    )
  }
}

function generateMeetCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz"
  let code = ""
  for (let i = 0; i < 21; i++) {
    if (i === 7 || i === 14) {
      code += "-"
    } else {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  return code
}
