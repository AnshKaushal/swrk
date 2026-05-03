import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import transporter from "@/lib/mailer"
import { otpEmailTemplate } from "@/emails/otpTemplate"

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await req.json()
    const normalizedEmail = (email || "").toLowerCase().trim()

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      )
    }

    await db()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentEmail = user.email?.toLowerCase().trim()
    if (normalizedEmail === currentEmail) {
      return NextResponse.json(
        { error: "New email must be different from the current email" },
        { status: 400 },
      )
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 409 },
      )
    }

    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    const hashedOTP = await bcrypt.hash(otp, 10)

    await User.findByIdAndUpdate(user._id, {
      $set: {
        pendingEmail: normalizedEmail,
        pendingEmailChangeToken: hashedOTP,
        pendingEmailChangeTokenExpiry: otpExpiry,
      },
    })

    const { subject, html, text } = otpEmailTemplate({
      otp,
      name: user.name || "there",
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject,
      html,
      text,
    })

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      email: normalizedEmail,
    })
  } catch (error) {
    console.error("[email-change/request]", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 },
    )
  }
}
