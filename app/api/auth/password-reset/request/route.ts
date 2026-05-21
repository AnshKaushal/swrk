import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import transporter from "@/lib/mailer"

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
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this email" },
        { status: 404 },
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email before resetting your password" },
        { status: 400 },
      )
    }

    const otp = generateOTP()
    const hashedOTP = await bcrypt.hash(otp, 10)
    const passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordResetToken: hashedOTP,
        passwordResetExpiry,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject: "Your Swrk password reset code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
            <h1 style="margin: 0 0 12px; font-size: 24px;">Reset your password</h1>
            <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">Use the code below to reset your Swrk password. It expires in 10 minutes.</p>
            <div style="font-size: 40px; font-weight: 800; letter-spacing: 10px; text-align: center; padding: 20px; border: 1px solid #cbd5e1; border-radius: 14px; margin-bottom: 24px;">${otp}</div>
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `.trim(),
      text: `Your Swrk password reset code is: ${otp}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    })

    return NextResponse.json({
      success: true,
      message: "Password reset code sent successfully",
    })
  } catch (err) {
    console.error("[password-reset request]", err)
    return NextResponse.json(
      { error: "Failed to send password reset code" },
      { status: 500 },
    )
  }
}
