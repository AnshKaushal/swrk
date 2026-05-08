import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password } = await req.json()

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: "Email, OTP, and password are required" },
        { status: 400 },
      )
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      )
    }

    await db()

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this email" },
        { status: 404 },
      )
    }

    if (!user.passwordResetToken || !user.passwordResetExpiry) {
      return NextResponse.json(
        { error: "Please request a new reset code" },
        { status: 400 },
      )
    }

    if (user.passwordResetExpiry < new Date()) {
      return NextResponse.json(
        { error: "Reset code expired. Please request a new one." },
        { status: 400 },
      )
    }

    const isValid = await bcrypt.compare(
      String(otp).trim(),
      user.passwordResetToken,
    )
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid reset code. Please try again." },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(String(password), 12)

    await User.findByIdAndUpdate(user._id, {
      $set: {
        password: hashedPassword,
        lastSeen: new Date(),
      },
      $unset: {
        passwordResetToken: "",
        passwordResetExpiry: "",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (err) {
    console.error("[password-reset confirm]", err)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    )
  }
}
