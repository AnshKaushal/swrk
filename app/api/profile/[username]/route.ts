import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"
import Resume from "@/models/resume"
import Position from "@/models/position"
import { getCredibilityStats } from "@/lib/interview-feedback"

const normalizeRole = (value?: string | null) => {
  if (value === "job-seeker") return "employee"
  if (value === "employee" || value === "employer" || value === "both") {
    return value
  }
  return "employee"
}

const resolveActiveRole = (
  value?: string | null,
  activeRole?: string | null,
) => {
  const normalizedRole = normalizeRole(value)
  if (normalizedRole === "both") {
    return activeRole === "employer" ? "employer" : "employee"
  }
  return normalizedRole
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params
    await db()

    const session = await auth()
    const currentUserId = session?.user?.id

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("-password -verificationToken -passwordResetToken -reports")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isOwner = currentUserId && currentUserId === user._id.toString()
    if (user.privacy?.profileVisibility === "hidden" && !isOwner) {
      return NextResponse.json({ error: "Profile is hidden" }, { status: 403 })
    }

    const normalizedRole = normalizeRole(user.role)
    const activeRole = resolveActiveRole(user.role, user.activeRole)

    const employeeProfile = await EmployeeProfile.findOne({
      user: user._id,
    }).select("-stats.totalLeftSwipes -stats.totalRightSwipes")
    const employerProfile = await EmployerProfile.findOne({ user: user._id })
    let resumes = []
    const allowResumes = isOwner || user.privacy?.showResumes !== false
    if (allowResumes) {
      resumes = await Resume.find(
        isOwner
          ? { user: user._id }
          : { user: user._id, isVisibleOnProfile: true },
      ).sort({ isFeatured: -1, createdAt: -1 })
    }

    const profile =
      activeRole === "employer" ? employerProfile : employeeProfile
    const credibilityStats = await getCredibilityStats(
      user._id.toString(),
      activeRole,
    )

    const positions = await Position.find({
      employerId: user._id,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .lean()

    const employerProfileObj = employerProfile?.toObject() || null
    if (employerProfileObj && positions.length > 0) {
      const existingPositionIds = new Set(
        (employerProfileObj.activeOpenings || [])
          .filter((o: any) => o.positionId)
          .map((o: any) => o.positionId.toString()),
      )
      const missingPositions = positions.filter(
        (p) => !existingPositionIds.has(p._id.toString()),
      )
      if (missingPositions.length > 0) {
        employerProfileObj.activeOpenings = [
          ...(employerProfileObj.activeOpenings || []),
          ...missingPositions.map((p) => ({
            positionId: p._id,
            title: p.title,
            description: p.description,
            location: p.locations?.length ? p.locations[0] : undefined,
            employmentType: p.employmentType,
            requiredSkills: p.skills || [],
            ctcMin: p.salaryRange?.min,
            ctcMax: p.salaryRange?.max,
            isActive: p.status === "active",
            openedAt: p.createdAt,
          })),
        ]
      }
    }

    return NextResponse.json({
      user: {
        ...user.toObject(),
        activeRole,
      },
      employeeProfile: employeeProfile?.toObject() || null,
      employerProfile: employerProfileObj,
      resumes: resumes.map((resume) => resume.toObject()),
      profile: profile?.toObject() || null,
      credibilityStats,
    })
  } catch (err) {
    console.error("[profile]", err)
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    )
  }
}
