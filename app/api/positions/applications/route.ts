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
    const limit = parseInt(searchParams.get("limit") || "50")

    const applications = await PositionSwipe.find({
      candidateId: session.user.id,
      direction: "right",
    })
      .sort({ applicationStatusUpdatedAt: -1, createdAt: -1 })
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
      .lean()

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

    return NextResponse.json({ applications: data })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    )
  }
}
