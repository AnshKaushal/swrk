import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import transporter from "@/lib/mailer"
import { otpEmailTemplate } from "@/emails/otpTemplate"

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      )
    }

    await db()

    const normalizedEmail = email.toLowerCase().trim()
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    const hashedOTP = await bcrypt.hash(otp, 10)

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          verificationToken: hashedOTP,
          verificationTokenExpiry: otpExpiry,
        },
        $setOnInsert: {
          name: "",
          authProvider: "email",
          onboardingStep: 0,
          onboardingCompleted: false,
          isVerified: false,
        },
      },
      { upsert: true, returnDocument: "after" },
    )

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
      message: "OTP sent successfully",
      userId: user._id.toString(),
      isNewUser: !user.isVerified,
    })
  } catch (err) {
    console.error("[send-otp]", err)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
