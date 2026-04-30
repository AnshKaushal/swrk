import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import NewsletterSubscriber from "@/models/newsletter-subscriber"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    await db()

    const subscriber = await NewsletterSubscriber.findOne({
      unsubscribeToken: token,
    })

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    subscriber.isVerified = false
    subscriber.isUnsubscribed = true
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[newsletter-unsubscribe]", err)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
