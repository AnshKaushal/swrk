import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"

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

    await Position.deleteOne({ _id: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 },
    )
  }
}
