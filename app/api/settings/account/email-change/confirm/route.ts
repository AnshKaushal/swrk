import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

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
      !user.pendingEmail ||
      !user.pendingEmailChangeToken ||
      !user.pendingEmailChangeTokenExpiry
    ) {
      return NextResponse.json(
        { error: "No pending email change request found" },
        { status: 400 },
      )
    }

    if (user.pendingEmailChangeTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      )
    }

    const isValid = await bcrypt.compare(
      otp.toString(),
      user.pendingEmailChangeToken,
    )

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      )
    }

    const existingUser = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 409 },
      )
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        email: user.pendingEmail,
        isVerified: true,
      },
      $unset: {
        pendingEmail: "",
        pendingEmailChangeToken: "",
        pendingEmailChangeTokenExpiry: "",
      },
    })

    return NextResponse.json({
      success: true,
      email: user.pendingEmail,
    })
  } catch (error) {
    console.error("[email-change/confirm]", error)
    return NextResponse.json(
      { error: "Failed to confirm email change" },
      { status: 500 },
    )
  }
}
