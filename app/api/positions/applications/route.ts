import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import PositionSwipe from "@/models/position-swipe"
import PublicApplication from "@/models/public-application"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const skip = (page - 1) * limit

    const filter = { candidateId: session.user.id, direction: "right" }
    const [swipeApplications, swipeTotal, publicApplications, publicTotal] = await Promise.all([
      PositionSwipe.find(filter)
        .sort({ applicationStatusUpdatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "positionId",
          select:
            "title description employmentType status salaryRange locations skills createdAt employerId",
          populate: {
            path: "employerId",
            select: "name username avatar companyName",
          },
        })
        .lean(),
      PositionSwipe.countDocuments(filter),
      PublicApplication.find({ candidateId: session.user.id })
        .sort({ createdAt: -1 })
        .populate({
          path: "positionId",
          select:
            "title description employmentType status salaryRange locations skills createdAt employerId",
          populate: {
            path: "employerId",
            select: "name username avatar companyName",
          },
        })
        .lean(),
      PublicApplication.countDocuments({ candidateId: session.user.id }),
    ])

    const swipeData = swipeApplications
      .filter((application) => application.positionId)
      .map((application) => ({
        _id: application._id,
        source: "swipe" as const,
        applicationStatus: application.applicationStatus || "new",
        applicationSubmittedAt: application.applicationSubmittedAt || null,
        applicationStatusUpdatedAt:
          application.applicationStatusUpdatedAt ||
          application.updatedAt ||
          application.createdAt ||
          null,
        applicationData:
          application.applicationData &&
          typeof application.applicationData === "object"
            ? application.applicationData
            : {},
        resumeUrl: application.resumeUrl || "",
        resumeFileName: application.resumeFileName || "",
        position: application.positionId,
      }))

    const publicData = publicApplications
      .filter((app) => app.positionId)
      .map((app) => ({
        _id: app._id,
        source: "public" as const,
        applicationStatus: app.status || "new",
        applicationSubmittedAt: app.createdAt || null,
        applicationStatusUpdatedAt: app.updatedAt || app.createdAt || null,
        applicationData:
          app.applicationData && typeof app.applicationData === "object"
            ? app.applicationData
            : {},
        resumeUrl: app.resumeUrl || "",
        resumeFileName: app.resumeFileName || "",
        position: app.positionId,
      }))

    const allApplications = [...swipeData, ...publicData].sort(
      (a, b) =>
        new Date(b.applicationStatusUpdatedAt || b.applicationSubmittedAt || 0).getTime() -
        new Date(a.applicationStatusUpdatedAt || a.applicationSubmittedAt || 0).getTime(),
    )

    const total = swipeTotal + publicTotal
    const paginated = allApplications.slice(skip, skip + limit)

    return NextResponse.json({ applications: paginated, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    )
  }
}
