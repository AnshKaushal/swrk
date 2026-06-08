import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import EmployerProfile from "@/models/employer"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await db()
    const { id } = await params

    const position = await Position.findById(id).lean()

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const { id } = await params

    const position = await Position.findById(id)

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (position.employerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this position" },
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
      status,
      isVisible,
      company,
      applicationForm,
      externalLink,
      isExternal,
    } = body

    if (title !== undefined) position.title = title
    if (description !== undefined) position.description = description
    if (roles !== undefined) position.roles = roles
    if (locations !== undefined) position.locations = locations
    if (industry !== undefined) position.industry = industry
    if (skills !== undefined) position.skills = skills
    if (experience !== undefined) position.experience = experience
    if (salaryRange !== undefined) position.salaryRange = salaryRange
    if (employmentType !== undefined) position.employmentType = employmentType
    if (status !== undefined) position.status = status
    if (isVisible !== undefined) position.isVisible = isVisible
    if (applicationForm !== undefined)
      position.applicationForm = applicationForm
    if (company !== undefined) position.company = company
    if (externalLink !== undefined) position.externalLink = externalLink
    if (isExternal !== undefined) position.isExternal = isExternal

    await position.save()

    await EmployerProfile.findOneAndUpdate(
      { user: session.user.id, "activeOpenings.positionId": position._id },
      {
        $set: {
          "activeOpenings.$.title": position.title,
          "activeOpenings.$.description": position.description,
          "activeOpenings.$.location":
            position.locations && position.locations.length > 0
              ? position.locations[0]
              : undefined,
          "activeOpenings.$.employmentType": position.employmentType,
          "activeOpenings.$.requiredSkills": position.skills || [],
          "activeOpenings.$.ctcMin": position.salaryRange?.min,
          "activeOpenings.$.ctcMax": position.salaryRange?.max,
          "activeOpenings.$.isActive": position.status === "active",
        },
      },
    )

    return NextResponse.json({ position })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const { id } = await params

    const position = await Position.findById(id)

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (position.employerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this position" },
        { status: 403 },
      )
    }

    const employerId = position.employerId

    await Position.deleteOne({ _id: id })

    await EmployerProfile.findOneAndUpdate(
      { user: employerId },
      { $pull: { activeOpenings: { positionId: id } } },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 },
    )
  }
}
