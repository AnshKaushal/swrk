import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PositionSwipe from "@/models/position-swipe"
import PositionMatch from "@/models/position-match"
import Notification from "@/models/notification"

const statusToMatchStatus: Record<string, string | null> = {
  viewed: null,
  shortlisted: null,
  interview: "interview_scheduled",
  rejected: "rejected",
  hired: "hired",
  submitted: null,
  withdrawn: null,
}

const allowedStatuses = new Set([
  "submitted",
  "viewed",
  "shortlisted",
  "interview",
  "rejected",
  "hired",
  "withdrawn",
])

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

    const position = await Position.findById(id).select("employerId").lean()
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (String(position.employerId) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const applications = await PositionSwipe.find({
      positionId: id,
      direction: "right",
    })
      .select(
        "candidateId applicationData applicationSubmittedAt applicationStatus applicationStatusUpdatedAt applicationStatusUpdatedBy createdAt updatedAt",
      )
      .populate(
        "candidateId",
        "name username avatar headline bio currentCity currentCountry preferredLocations desiredRoles employmentType",
      )
      .populate("applicationStatusUpdatedBy", "name username avatar")
      .sort({ applicationStatusUpdatedAt: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      applications: applications.map((application) => ({
        _id: application._id,
        candidate: application.candidateId,
        applicationData:
          application.applicationData &&
          typeof application.applicationData === "object"
            ? application.applicationData
            : {},
        applicationStatus: application.applicationStatus || "submitted",
        applicationSubmittedAt: application.applicationSubmittedAt || null,
        applicationStatusUpdatedAt:
          application.applicationStatusUpdatedAt ||
          application.updatedAt ||
          application.createdAt ||
          null,
        applicationStatusUpdatedBy:
          application.applicationStatusUpdatedBy || null,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    )
  }
}

export async function PATCH(
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

    const position = await Position.findById(id)
      .select("employerId title")
      .lean()
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (String(position.employerId) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const candidateId = String(body.candidateId || "").trim()
    const nextStatus = String(body.status || "").trim()

    if (!candidateId || !nextStatus) {
      return NextResponse.json(
        { error: "candidateId and status required" },
        { status: 400 },
      )
    }

    if (!allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const application = await PositionSwipe.findOne({
      candidateId,
      positionId: id,
      direction: "right",
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      )
    }

    application.applicationStatus = nextStatus
    application.applicationStatusUpdatedAt = new Date()
    application.applicationStatusUpdatedBy = session.user.id
    await application.save()

    const matchStatus = statusToMatchStatus[nextStatus]
    if (matchStatus) {
      await PositionMatch.updateOne(
        {
          candidateId,
          employerId: session.user.id,
          positionId: id,
        },
        {
          $set: {
            status: matchStatus,
            ...(nextStatus === "hired" ? { hiredAt: new Date() } : {}),
            ...(nextStatus === "rejected"
              ? { rejectedAt: new Date(), rejectedBy: "employer" }
              : {}),
          },
        },
      )
    }

    await Notification.create({
      user: candidateId,
      actor: session.user.id,
      type: "application_status_update",
      title: `Application updated for ${position.title}`,
      message: `Your application has been marked as ${nextStatus}.`,
      link: "/dashboard/jobs",
      data: {
        positionId: id,
        status: nextStatus,
      },
    })

    return NextResponse.json({
      success: true,
      applicationStatus: nextStatus,
      applicationStatusUpdatedAt: application.applicationStatusUpdatedAt,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 },
    )
  }
}
