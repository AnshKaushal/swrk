import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/mongodb"
import NewsletterSubscriber from "@/models/newsletter-subscriber"
import transporter from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      )
    }

    await db()

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await NewsletterSubscriber.findOne({
      email: normalizedEmail,
    })

    if (existing?.isVerified && !existing.isUnsubscribed) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "Already subscribed",
      })
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await NewsletterSubscriber.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          isVerified: false,
          isUnsubscribed: false,
          unsubscribedAt: null,
          verificationToken,
          verificationTokenExpiry,
          lastRequestedAt: new Date(),
        },
        $setOnInsert: {
          subscribedAt: null,
          verifiedAt: null,
        },
      },
      { upsert: true, returnDocument: "after" },
    )

    const verifyUrl = new URL(
      `/api/newsletter/confirm?token=${verificationToken}`,
      req.nextUrl.origin,
    )

    const subject = "Confirm your Mutch newsletter subscription"
    const text = `Confirm your subscription by visiting: ${verifyUrl.toString()}`
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Confirm your subscription</h2>
        <p>Thanks for joining Mutch updates. Click below to confirm:</p>
        <p><a href="${verifyUrl.toString()}" style="color: #2563eb;">Confirm subscription</a></p>
        <p>If the button does not work, paste this link in your browser:</p>
        <p>${verifyUrl.toString()}</p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: normalizedEmail,
      subject,
      text,
      html,
    })

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    })
  } catch (err) {
    console.error("[newsletter-subscribe]", err)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}
