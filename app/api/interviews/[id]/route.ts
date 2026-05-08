import { auth } from "../../auth/[...nextauth]/route"
import Interview from "@/models/interview"
import Notification from "@/models/notification"
import { db } from "@/lib/mongodb"
import { NextRequest, NextResponse } from "next/server"
import { emitToUser, getSocketServer } from "@/lib/socket-server"

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

    const recipientId =
      interview.employer.toString() === session.user.id
        ? interview.employee.toString()
        : interview.employer.toString()

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
      emitToUser(recipientId, "notification:new", {
        type: `interview_${status}`,
        title: notificationTitle,
        message: notificationMessage,
        link: "/dashboard/interviews",
        interviewId: interview._id,
      })
      emitToUser(recipientId, "interview:update", {
        interviewId: interview._id,
        status,
      })
    }

    return NextResponse.json({ interview: interview.toObject() })
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
