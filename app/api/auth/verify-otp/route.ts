import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 },
      )
    }

    await db()

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      )
    }

    const isValid = await bcrypt.compare(otp.toString(), user.verificationToken)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid OTP. Please try again." },
        { status: 400 },
      )
    }

    const otpLoginToken = crypto.randomBytes(32).toString("hex")
    const otpLoginTokenExpiry = new Date(Date.now() + 5 * 60 * 1000)

    const newOnboardingStep = user.onboardingCompleted
      ? user.onboardingStep
      : Math.max(user.onboardingStep, 1)

    await User.findByIdAndUpdate(user._id, {
      $set: {
        isVerified: true,
        onboardingStep: newOnboardingStep,
        otpLoginToken,
        otpLoginTokenExpiry,
        lastSeen: new Date(),
      },
      $unset: {
        verificationToken: "",
        verificationTokenExpiry: "",
      },
    })

    return NextResponse.json({
      success: true,
      email: user.email,
      otpLoginToken,
      onboardingStep: newOnboardingStep,
      onboardingCompleted: user.onboardingCompleted,
      hasPassword: !!user.password,
    })
  } catch (err) {
    console.error("[verify-otp]", err)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
