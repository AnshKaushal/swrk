import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import PositionSwipe from "@/models/position-swipe"

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
    const [applications, total] = await Promise.all([
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
    ])

    const data = applications
      .filter((application) => application.positionId)
      .map((application) => ({
        _id: application._id,
        applicationStatus: application.applicationStatus || "submitted",
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
        position: application.positionId,
      }))

    return NextResponse.json({ applications: data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    )
  }
}
