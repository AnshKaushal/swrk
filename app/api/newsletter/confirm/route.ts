import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/mongodb"
import NewsletterSubscriber from "@/models/newsletter-subscriber"
import transporter from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      const url = new URL("/newsletter/unsubscribe", req.nextUrl.origin)
      return NextResponse.redirect(url)
    }

    await db()

    const subscriber = await NewsletterSubscriber.findOne({
      verificationToken: token,
    })

    if (
      !subscriber ||
      !subscriber.verificationTokenExpiry ||
      subscriber.verificationTokenExpiry < new Date()
    ) {
      const url = new URL("/newsletter/unsubscribe", req.nextUrl.origin)
      return NextResponse.redirect(url)
    }

    if (!subscriber.unsubscribeToken) {
      subscriber.unsubscribeToken = crypto.randomBytes(32).toString("hex")
    }

    subscriber.isVerified = true
    subscriber.isUnsubscribed = false
    subscriber.unsubscribedAt = undefined
    subscriber.verifiedAt = new Date()
    subscriber.subscribedAt = new Date()
    subscriber.verificationToken = undefined
    subscriber.verificationTokenExpiry = undefined
    await subscriber.save()

    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`
    const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`

    const subject = "You are subscribed to Swrk"
    const text = `You are subscribed to Swrk updates. Unsubscribe: ${unsubscribeUrl}`
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Subscription confirmed</h2>
        <p>You are now subscribed to Swrk updates.</p>
        <p><a href="${unsubscribeUrl}" style="color: #2563eb;">Unsubscribe</a></p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: subscriber.email,
      subject,
      text,
      html,
    })

    const redirectUrl = new URL("/newsletter/confirmed", req.nextUrl.origin)
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error("[newsletter-confirm]", err)
    const redirectUrl = new URL("/newsletter/unsubscribe", req.nextUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }
}
