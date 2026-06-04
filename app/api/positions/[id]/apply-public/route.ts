import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PublicApplication from "@/models/public-application"
import User from "@/models/user"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await db()
    const { id } = await params

    const position = await Position.findById(id)
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (position.status !== "active") {
      return NextResponse.json({ error: "Position is not active" }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, phone, linkedin, location, workExperience, agreedToTerms, applicationData } = body

    if (!name || !email || !agreedToTerms) {
      return NextResponse.json(
        { error: "Name, email, and terms agreement are required" },
        { status: 400 },
      )
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the terms and conditions" },
        { status: 400 },
      )
    }

    let candidateId = null
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      candidateId = existingUser._id
    }

    const application = new PublicApplication({
      positionId: id,
      employerId: position.employerId,
      candidateId,
      name,
      email,
      phone: phone || "",
      linkedin: linkedin || "",
      location: location || "",
      workExperience: workExperience || "",
      agreedToTerms,
      applicationData: applicationData || {},
      isExternal: position.isExternal || false,
      externalLink: position.externalLink || "",
    })

    await application.save()

    return NextResponse.json({
      success: true,
      hasAccount: !!candidateId,
      externalLink: position.isExternal ? position.externalLink : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    )
  }
}
