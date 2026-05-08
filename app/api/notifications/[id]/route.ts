import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id } = await params
    await db()
    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { $set: { read: body.read === true } },
      { new: true },
    )

    if (!notif)
      return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ success: true, notification: notif })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await db()
    await Notification.deleteOne({ _id: id, user: session.user.id })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
