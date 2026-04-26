import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, username, role, phone, dateOfBirth, gender, step } =
      await req.json()

    await db()

    const updateData: any = {}
    if (name) updateData.name = name
    if (username) updateData.username = username
    if (role) updateData.role = role
    if (phone) updateData.phone = phone
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth)
    if (gender) updateData.gender = gender
    if (step) {
      updateData.onboardingStep = step
      if (step === 4) updateData.onboardingCompleted = true
    }

    await User.findByIdAndUpdate(session.user.id, { $set: updateData })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[onboarding]", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
