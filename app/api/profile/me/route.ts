import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"
import Resume from "@/models/resume"

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

    const employeeProfile =
      normalizedRole === "employee" || normalizedRole === "both"
        ? await EmployeeProfile.findOne({ user: user._id })
        : null
    const employerProfile =
      normalizedRole === "employer" || normalizedRole === "both"
        ? await EmployerProfile.findOne({ user: user._id })
        : null
    const resumes = await Resume.find({ user: user._id }).sort({
      isFeatured: -1,
      createdAt: -1,
    })

    const profile =
      activeRole === "employer" ? employerProfile : employeeProfile

    return NextResponse.json({
      user: user.toObject(),
      activeRole,
      employeeProfile: employeeProfile?.toObject() || null,
      employerProfile: employerProfile?.toObject() || null,
      resumes: resumes.map((resume) => resume.toObject()),
      profile: profile?.toObject() || null,
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

    const userUpdateData = {
      name: userData.name,
      phone: userData.phone,
      address: userData.address,
      gender: userData.gender,
      linkedinUrl: userData.linkedinUrl,
      githubUrl: userData.githubUrl,
      portfolioUrl: userData.portfolioUrl,
      professionalLinks: userData.professionalLinks || [],
      privacy: userData.visibility || user.privacy,
      activeRole: resolvedActiveRole,
    }

    await User.updateOne({ _id: user._id }, { $set: userUpdateData })

    if (normalizedRole === "employee" || normalizedRole === "both") {
      let employeeProfile = await EmployeeProfile.findOne({ user: user._id })

      if (!employeeProfile) {
        employeeProfile = new EmployeeProfile({
          user: user._id,
        })
      }

      const profileUpdateData = {
        headline: employeeData.headline,
        bio: employeeData.bio,
        tagline: employeeData.tagline,
        currentStatus: employeeData.currentStatus,
        availableFrom: employeeData.availableFrom,
        currentCity: employeeData.currentCity,
        currentCountry: employeeData.currentCountry,
        workPreference: employeeData.workPreference,
        primarySkills: employeeData.primarySkills || [],
        secondarySkills: employeeData.secondarySkills || [],
        desiredRoles: employeeData.desiredRoles || [],
        desiredIndustries: employeeData.desiredIndustries || [],
        desiredCompanyTypes: employeeData.desiredCompanyTypes || [],
        desiredCompanies: employeeData.desiredCompanies || [],
        desiredCompanySize: employeeData.desiredCompanySize,
        preferredLocations: employeeData.preferredLocations || [],
        willingToRelocate: employeeData.willingToRelocate,
        currentCTC: employeeData.currentCTC,
        expectedCTC: employeeData.expectedCTC,
        employmentType: employeeData.employmentType || [],
        totalExperienceYears: employeeData.totalExperienceYears,
        experienceLevel: employeeData.experienceLevel,
        workHistory: employeeData.workHistory || employeeProfile.workHistory,
        education: employeeData.education || employeeProfile.education,
        highestQualification: employeeData.highestQualification,
        certifications:
          employeeData.certifications || employeeProfile.certifications,
        projects: employeeData.projects || employeeProfile.projects,
        socialLinks: employeeData.socialLinks || employeeProfile.socialLinks,
        companyRatingMin: employeeData.companyRatingMin,
        avoidCompanies: employeeData.avoidCompanies || [],
        preferredBenefits: employeeData.preferredBenefits || [],
      }

      await EmployeeProfile.updateOne(
        { _id: employeeProfile._id },
        { $set: profileUpdateData },
      )
    }

    if (normalizedRole === "employer" || normalizedRole === "both") {
      let employerProfile = await EmployerProfile.findOne({ user: user._id })

      if (!employerProfile) {
        employerProfile = new EmployerProfile({
          user: user._id,
        })
      }

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
        filters: employerData.filters || employerProfile.filters,
      }

      await EmployerProfile.updateOne(
        { _id: employerProfile._id },
        { $set: employerUpdateData },
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
