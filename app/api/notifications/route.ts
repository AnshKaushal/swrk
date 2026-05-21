import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit") || 25), 100)
    const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0)

    const notifications = await Notification.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean()

    const hasMore = notifications.length > limit

    const pageNotifications = hasMore
      ? notifications.slice(0, limit)
      : notifications

    return NextResponse.json({ notifications: pageNotifications, hasMore })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // creation can be server-to-server; require minimal validation
    if (!body.user || !body.type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    await db()
    const n = await Notification.create({
      user: body.user,
      actor: body.actor,
      type: body.type,
      title: body.title,
      message: body.message,
      link: body.link,
      data: body.data || {},
    })

    return NextResponse.json({ notification: n })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
