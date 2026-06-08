import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"
import Resume from "@/models/resume"
import Interview from "@/models/interview"
import PositionMatch from "@/models/position-match"
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

const normalizeUsername = (value?: string | null) =>
  value?.trim().toLowerCase() || ""

const isValidUsername = (value: string) => /^[a-zA-Z0-9_-]{3,20}$/.test(value)

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findOne({ email: session.user.email }).select(
      "-password -verificationToken -passwordResetToken",
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const normalizedRole = normalizeRole(user.role)
    const activeRole = resolveActiveRole(user.role, user.activeRole)

    const employeeProfile = await EmployeeProfile.findOne({ user: user._id })
    const employerProfile = await EmployerProfile.findOne({ user: user._id })
    const resumes = await Resume.find({ user: user._id }).sort({
      isFeatured: -1,
      createdAt: -1,
    })

    const positions = await Position.find({
      employerId: user._id,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .lean()

    const profile =
      activeRole === "employer" ? employerProfile : employeeProfile

    let metricsData: Record<string, any> = {}
    const credibilityStats = await getCredibilityStats(
      user._id.toString(),
      activeRole,
    )

    if (activeRole === "employee") {
      const resumeCount = resumes.length
      const completedInterviews = await Interview.countDocuments({
        employee: user._id,
        status: "completed",
      })

      metricsData = {
        profileCompletion: employeeProfile?.profileCompletionScore || 0,
        resumeQuality: resumeCount > 0 ? Math.min(resumeCount * 25, 100) : 0,
        skillsMatchScore: employeeProfile?.profileCompletionScore || 0,
        avgResponseTime: Math.floor(Math.random() * 2) + 1,
        currentStreak:
          completedInterviews > 0 ? Math.floor(Math.random() * 14) + 1 : 0,
      }
    } else if (activeRole === "employer") {
      const activeOpenings = employerProfile?.activeOpenings || []
      const syncedPositionIds = new Set(
        activeOpenings
          .filter((o: any) => o.positionId)
          .map((o: any) => o.positionId.toString()),
      )
      const unsyncedActiveCount = positions.filter(
        (p) => !syncedPositionIds.has(p._id.toString()) && p.status === "active",
      ).length
      const openPositions =
        activeOpenings.filter((pos: any) => pos.isActive).length +
        unsyncedActiveCount

      const hiredCount = await PositionMatch.countDocuments({
        employer: user._id,
        status: "hired",
      })

      const totalInterviews = await Interview.countDocuments({
        employer: user._id,
      })

      const inProgressCount = await PositionMatch.countDocuments({
        employer: user._id,
        status: "interview",
      })

      const offersExtendedCount = await PositionMatch.countDocuments({
        employer: user._id,
        status: "offer",
      })

      metricsData = {
        avgTimeToHire:
          hiredCount > 0
            ? `${Math.floor(Math.random() * 20) + 10} days`
            : "N/A",
        avgInterviews:
          totalInterviews > 0
            ? Math.ceil(totalInterviews / Math.max(hiredCount, 1))
            : 0,
        acceptanceRate:
          hiredCount > 0 ? Math.floor(Math.random() * 20) + 70 : 0,
        costPerHire:
          hiredCount > 0 ? Math.floor(Math.random() * 5000) + 1000 : 0,
        openPositions,
        inProgress: inProgressCount,
        offersExtended: offersExtendedCount,
      }
    }

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
      user: user.toObject(),
      activeRole,
      employeeProfile: employeeProfile?.toObject() || null,
      employerProfile: employerProfileObj,
      resumes: resumes.map((resume) => resume.toObject()),
      profile: profile?.toObject() || null,
      credibilityStats,
      ...metricsData,
    })
  } catch (err) {
    console.error("[profile/me GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    await db()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = data.user || {}
    const employeeData = data.employeeProfile || {}
    const employerData = data.employerProfile || {}
    const normalizedRole = normalizeRole(user.role)
    const resolvedActiveRole = resolveActiveRole(
      user.role,
      userData.activeRole || data.activeRole || user.activeRole,
    )

    const userUpdateData: Record<string, unknown> = {}

    if (userData.name !== undefined) userUpdateData.name = userData.name
    if (userData.username !== undefined) {
      const nextUsername = normalizeUsername(userData.username)

      if (!nextUsername) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 },
        )
      }

      if (!isValidUsername(nextUsername)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-20 characters and use only letters, numbers, underscore, or dash",
          },
          { status: 400 },
        )
      }

      const existingUser = await User.findOne({
        username: nextUsername,
        _id: { $ne: user._id },
      }).select("_id")

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 },
        )
      }

      userUpdateData.username = nextUsername
    }
    if (userData.phone !== undefined) userUpdateData.phone = userData.phone
    if (userData.address !== undefined)
      userUpdateData.address = userData.address
    if (userData.gender !== undefined) userUpdateData.gender = userData.gender
    if (userData.avatar !== undefined) userUpdateData.avatar = userData.avatar
    if (userData.banner !== undefined) userUpdateData.banner = userData.banner
    if (userData.linkedinUrl !== undefined)
      userUpdateData.linkedinUrl = userData.linkedinUrl
    if (userData.githubUrl !== undefined)
      userUpdateData.githubUrl = userData.githubUrl
    if (userData.portfolioUrl !== undefined)
      userUpdateData.portfolioUrl = userData.portfolioUrl
    if (userData.professionalLinks !== undefined)
      userUpdateData.professionalLinks = userData.professionalLinks
    if (resolvedActiveRole !== undefined)
      userUpdateData.activeRole = resolvedActiveRole

    if (userData.visibility) {
      const currentPrivacy = user.privacy?.toObject
        ? user.privacy.toObject()
        : user.privacy || {}
      userUpdateData.privacy = {
        ...currentPrivacy,
        ...userData.visibility,
      }
    }

    await User.updateOne({ _id: user._id }, { $set: userUpdateData })

    const hasEmployeePayload =
      employeeData &&
      typeof employeeData === "object" &&
      Object.keys(employeeData).length > 0

    if (hasEmployeePayload) {
      const profileUpdateData: Record<string, unknown> = {}

      const assignIfDefined = (key: string, value: unknown) => {
        if (value !== undefined) {
          profileUpdateData[key] = value
        }
      }

      assignIfDefined("headline", employeeData.headline)
      assignIfDefined("bio", employeeData.bio)
      assignIfDefined("tagline", employeeData.tagline)
      assignIfDefined("currentStatus", employeeData.currentStatus)
      assignIfDefined("availableFrom", employeeData.availableFrom)
      assignIfDefined("currentCity", employeeData.currentCity)
      assignIfDefined("currentState", employeeData.currentState)
      assignIfDefined("currentCountry", employeeData.currentCountry)
      assignIfDefined("workPreference", employeeData.workPreference)
      assignIfDefined("primarySkills", employeeData.primarySkills)
      assignIfDefined("secondarySkills", employeeData.secondarySkills)
      assignIfDefined("desiredRoles", employeeData.desiredRoles)
      assignIfDefined("desiredIndustries", employeeData.desiredIndustries)
      assignIfDefined("desiredCompanyTypes", employeeData.desiredCompanyTypes)
      assignIfDefined("desiredCompanies", employeeData.desiredCompanies)
      assignIfDefined("desiredCompanySize", employeeData.desiredCompanySize)
      assignIfDefined("preferredLocations", employeeData.preferredLocations)
      assignIfDefined("willingToRelocate", employeeData.willingToRelocate)
      assignIfDefined("currentCTC", employeeData.currentCTC)
      assignIfDefined("expectedCTC", employeeData.expectedCTC)
      assignIfDefined("employmentType", employeeData.employmentType)
      assignIfDefined("totalExperienceYears", employeeData.totalExperienceYears)
      assignIfDefined("experienceLevel", employeeData.experienceLevel)
      assignIfDefined("workHistory", employeeData.workHistory)
      assignIfDefined("education", employeeData.education)
      assignIfDefined("highestQualification", employeeData.highestQualification)
      assignIfDefined("certifications", employeeData.certifications)
      assignIfDefined("projects", employeeData.projects)
      assignIfDefined("socialLinks", employeeData.socialLinks)
      assignIfDefined("companyRatingMin", employeeData.companyRatingMin)
      assignIfDefined("avoidCompanies", employeeData.avoidCompanies)
      assignIfDefined("preferredBenefits", employeeData.preferredBenefits)

      await EmployeeProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: profileUpdateData,
          $setOnInsert: { user: user._id },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      )
    }

    const hasEmployerPayload =
      employerData &&
      typeof employerData === "object" &&
      Object.keys(employerData).length > 0

    if (hasEmployerPayload && employerData.companyName?.trim()) {
      const existingEmployerProfile = await EmployerProfile.findOne({
        user: user._id,
      })

      const employerUpdateData = {
        recruiterName: employerData.recruiterName,
        recruiterTitle: employerData.recruiterTitle,
        recruiterBio: employerData.recruiterBio,
        companyName: employerData.companyName,
        companyLogo: employerData.companyLogo,
        companyWebsite: employerData.companyWebsite,
        companyLinkedin: employerData.companyLinkedin,
        companyDescription: employerData.companyDescription,
        companyTagline: employerData.companyTagline,
        industry: employerData.industry || [],
        companyType: employerData.companyType,
        companySize: employerData.companySize,
        foundedYear: employerData.foundedYear,
        headquarters: employerData.headquarters,
        operatingIn: employerData.operatingIn || [],
        fundingStage: employerData.fundingStage,
        totalFunding: employerData.totalFunding,
        culture: employerData.culture || [],
        perks: employerData.perks || [],
        workStyle: employerData.workStyle,
        glassdoorRating: employerData.glassdoorRating,
        glassdoorUrl: employerData.glassdoorUrl,
        filters: employerData.filters || existingEmployerProfile?.filters,
      }

      await EmployerProfile.findOneAndUpdate(
        { user: user._id },
        {
          $set: employerUpdateData,
          $setOnInsert: { user: user._id },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (err) {
    console.error("[profile/me PUT]", err)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    )
  }
}
