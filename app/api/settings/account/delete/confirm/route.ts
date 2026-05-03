import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"
import UserSubscription from "@/models/user-subscription"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { otp } = await req.json()
    if (!otp) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 },
      )
    }

    await db()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (
      !user.pendingAccountDeletionToken ||
      !user.pendingAccountDeletionTokenExpiry
    ) {
      return NextResponse.json(
        { error: "No pending deletion request found" },
        { status: 400 },
      )
    }

    if (user.pendingAccountDeletionTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      )
    }

    const isValid = await bcrypt.compare(
      otp.toString(),
      user.pendingAccountDeletionToken,
    )

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      )
    }

    await Promise.all([
      EmployeeProfile.deleteMany({ user: user._id }),
      EmployerProfile.deleteMany({ user: user._id }),
      UserSubscription.deleteMany({ user: user._id }),
    ])

    await User.findByIdAndDelete(user._id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[delete/confirm]", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    )
  }
}
