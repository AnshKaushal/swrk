import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"
import transporter from "@/lib/mailer"
import { otpEmailTemplate } from "@/emails/otpTemplate"

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    const hashedOTP = await bcrypt.hash(otp, 10)

    await User.findByIdAndUpdate(user._id, {
      $set: {
        pendingAccountDeletionToken: hashedOTP,
        pendingAccountDeletionTokenExpiry: otpExpiry,
      },
    })

    const { subject, html, text } = otpEmailTemplate({
      otp,
      name: user.name || "there",
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
      text,
    })

    return NextResponse.json({
      success: true,
      message: "Deletion code sent successfully",
    })
  } catch (error) {
    console.error("[delete/request]", error)
    return NextResponse.json(
      { error: "Failed to send deletion code" },
      { status: 500 },
    )
  }
}
