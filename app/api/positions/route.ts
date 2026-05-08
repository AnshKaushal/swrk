import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import User from "@/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { searchParams } = new URL(req.url)
    const employerId = searchParams.get("employerId")

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

    const positions = await Position.find({ employerId })
      .sort({ createdAt: -1 })
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
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description required" },
        { status: 400 },
      )
    }

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
