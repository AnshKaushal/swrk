import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const unread = await Notification.countDocuments({
      user: session.user.id,
      read: false,
    })

    return NextResponse.json({ unread })
  } catch (error) {
    console.error("Error fetching unread notifications:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
