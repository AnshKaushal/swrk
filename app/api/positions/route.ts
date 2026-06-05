import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import User from "@/models/user"
import { getJobPostQuota } from "@/lib/job-posting-limits"
import { generateUniqueSlug } from "@/lib/slug"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const employerId = searchParams.get("employerId")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    if (!employerId) {
      return NextResponse.json(
        { error: "employerId required" },
        { status: 400 },
      )
    }

    if (employerId !== session.user.id) {
      const employer = await User.findById(employerId)
      if (!employer) {
        return NextResponse.json(
          { error: "Employer not found" },
          { status: 404 },
        )
      }
    }

    const filter = { employerId }
    const [positions, total] = await Promise.all([
      Position.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Position.countDocuments(filter),
    ])

    return NextResponse.json({
      positions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!["employer", "both"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only employers can post positions" },
        { status: 403 },
      )
    }

    const quota = await getJobPostQuota(session.user.id)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Job posting limit reached",
          used: quota.used,
          limit: quota.limit,
          plan: quota.planName,
          isUnlimited: quota.isUnlimited,
        },
        { status: 429 },
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      roles,
      locations,
      industry,
      skills,
      experience,
      salaryRange,
      employmentType,
      applicationForm,
      company,
      externalLink,
      isExternal,
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description required" },
        { status: 400 },
      )
    }

    const slug = await generateUniqueSlug(title)

    const position = new Position({
      employerId: session.user.id,
      title,
      description,
      roles: roles || [],
      locations: locations || [],
      industry: industry || "",
      skills: skills || [],
      experience: experience || "any",
      salaryRange: salaryRange || {},
      employmentType: employmentType || "full-time",
      status: "draft",
      applicationForm,
      slug,
      company: company || "",
      externalLink: externalLink || "",
      isExternal: isExternal || false,
    })

    await position.save()

    return NextResponse.json({ position }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 },
    )
  }
}
