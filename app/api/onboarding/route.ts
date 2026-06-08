import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import PublicApplication from "@/models/public-application"

const normalizeRole = (value: string) => {
  if (value === "job-seeker") return "employee"
  if (value === "employee" || value === "employer" || value === "both") {
    return value
  }
  return "employee"
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, username, role, phone, dateOfBirth, gender, step } =
      await req.json()
    const normalizedRole = role ? normalizeRole(role) : undefined

    await db()

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (username) updateData.username = username
    if (normalizedRole) {
      updateData.role = normalizedRole
      updateData.activeRole =
        normalizedRole === "both" ? "employee" : normalizedRole
    }
    if (phone) updateData.phone = phone
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (gender) updateData.gender = gender
    if (step) {
      updateData.onboardingStep = step
      if (step === 4) updateData.onboardingCompleted = true
    }

    await User.findByIdAndUpdate(session.user.id, { $set: updateData })

    const user = await User.findById(session.user.id).select("email").lean()
    if (user?.email) {
      await PublicApplication.updateMany(
        { email: user.email, candidateId: null },
        { $set: { candidateId: session.user.id } },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("[onboarding]", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
