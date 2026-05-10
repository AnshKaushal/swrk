import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"
import Resume from "@/models/resume"
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
    // respect user's resume privacy setting for non-owners
    const allowResumes = isOwner || user.privacy?.showResumes !== false
    if (allowResumes) {
      resumes = await Resume.find({
        user: user._id,
        isVisibleOnProfile: true,
      }).sort({ isFeatured: -1, createdAt: -1 })
    }

    const profile =
      activeRole === "employer" ? employerProfile : employeeProfile
    const credibilityStats = await getCredibilityStats(
      user._id.toString(),
      activeRole,
    )

    return NextResponse.json({
      user: {
        ...user.toObject(),
        activeRole,
      },
      employeeProfile: employeeProfile?.toObject() || null,
      employerProfile: employerProfile?.toObject() || null,
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
