import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PositionSwipe from "@/models/position-swipe"
import PositionMatch from "@/models/position-match"
import PublicApplication from "@/models/public-application"
import Notification from "@/models/notification"

const statusToMatchStatus: Record<string, string | null> = {
  new: null,
  screened: null,
  shortlisted: null,
  maybe: null,
  interview: "interview_scheduled",
  offer: "offer",
  hired: "hired",
  rejected: "rejected",
  withdrawn: null,
}

const allowedStatuses = new Set([
  "new",
  "screened",
  "shortlisted",
  "maybe",
  "interview",
  "offer",
  "hired",
  "rejected",
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

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const skip = (page - 1) * limit

    const filter = { positionId: id, direction: "right" }
    const [applications, total] = await Promise.all([
      PositionSwipe.find(filter)
        .select(
          "candidateId applicationData applicationSubmittedAt applicationStatus applicationStatusUpdatedAt applicationStatusUpdatedBy resumeUrl resumeFileName createdAt updatedAt",
        )
        .populate(
          "candidateId",
          "name username avatar headline bio currentCity currentCountry preferredLocations desiredRoles employmentType",
        )
        .populate("applicationStatusUpdatedBy", "name username avatar")
        .sort({ applicationStatusUpdatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PositionSwipe.countDocuments(filter),
    ])

    return NextResponse.json({
      applications: applications.map((application) => ({
        _id: application._id,
        candidate: application.candidateId,
        applicationData:
          application.applicationData &&
          typeof application.applicationData === "object"
            ? application.applicationData
            : {},
        applicationStatus: application.applicationStatus || "new",
        applicationSubmittedAt: application.applicationSubmittedAt || null,
        applicationStatusUpdatedAt:
          application.applicationStatusUpdatedAt ||
          application.updatedAt ||
          application.createdAt ||
          null,
        applicationStatusUpdatedBy:
          application.applicationStatusUpdatedBy || null,
        resumeUrl: application.resumeUrl || "",
        resumeFileName: application.resumeFileName || "",
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
    const nextStatus = String(body.status || "").trim()

    if (!nextStatus) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      )
    }

    if (!allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const publicApplicationId = String(body.publicApplicationId || "").trim()
    const candidateId = String(body.candidateId || "").trim()

    if (publicApplicationId) {
      const publicApp = await PublicApplication.findOne({
        _id: publicApplicationId,
        positionId: id,
      })

      if (!publicApp) {
        return NextResponse.json(
          { error: "Public application not found" },
          { status: 404 },
        )
      }

      publicApp.status = nextStatus
      await publicApp.save()

      if (publicApp.candidateId) {
        await Notification.create({
          user: publicApp.candidateId,
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
      }

      return NextResponse.json({
        success: true,
        applicationStatus: nextStatus,
        applicationStatusUpdatedAt: publicApp.updatedAt,
      })
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId or publicApplicationId required" },
        { status: 400 },
      )
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
      const matchUpdate: Record<string, unknown> = {
        status: matchStatus,
      }
      if (nextStatus === "hired") matchUpdate.hiredAt = new Date()
      if (nextStatus === "rejected") {
        matchUpdate.rejectedAt = new Date()
        matchUpdate.rejectedBy = "employer"
      }
      await PositionMatch.updateOne(
        {
          candidateId,
          employerId: session.user.id,
          positionId: id,
        },
        { $set: matchUpdate },
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
