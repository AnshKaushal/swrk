import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PositionSwipe from "@/models/position-swipe"
import EmployeeProfile from "@/models/employee"
import User from "@/models/user"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const excludeIds = searchParams.getAll("excludeId")

    // Get candidate's profile for filtering
    const userProfile = await User.findById(session.user.id).lean()
    const employeeProfile = await EmployeeProfile.findOne({
      userId: session.user.id,
    }).lean()

    // Build query
    const query: any = {
      status: "active",
      isVisible: true,
    }

    // Filter by candidate preferences
    if (
      employeeProfile?.desiredRoles &&
      employeeProfile.desiredRoles.length > 0
    ) {
      query.$or = [
        { roles: { $in: employeeProfile.desiredRoles } },
        { roles: { $size: 0 } },
      ]
    }

    if (
      employeeProfile?.preferredLocations &&
      employeeProfile.preferredLocations.length > 0
    ) {
      query.$or = query.$or || []
      query.$or.push({ locations: { $in: employeeProfile.preferredLocations } })
    }

    if (
      employeeProfile?.desiredIndustries &&
      employeeProfile.desiredIndustries.length > 0
    ) {
      query.$or = query.$or || []
      query.$or.push({ industry: { $in: employeeProfile.desiredIndustries } })
    }

    // Exclude already swiped positions
    if (excludeIds.length > 0) {
      const validIds = excludeIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id))

      const swipedPositions = await PositionSwipe.find({
        candidateId: session.user.id,
        positionId: { $in: validIds },
      }).select("positionId")

      const swipedIds = swipedPositions.map((s) => s.positionId)
      query._id = { $nin: swipedIds }
    }

    const positions = await Position.find(query)
      .populate("employerId", "name avatar companyName")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ positions })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    )
  }
}
