import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"
import AuditLog from "@/models/audit-log"
import mongoose from "mongoose"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    await db()
    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const body = await req.json()
    const action = body.action
    if (action === "dismiss") {
      const n = await Notification.findByIdAndUpdate(
        id,
        { status: "dismissed" },
        { new: true },
      )
      await AuditLog.create({
        actor: session.user.id,
        action: "dismiss_notification",
        targetType: "notification",
        targetId: id,
        reason: body.reason,
      })
      return NextResponse.json({ notification: n })
    } else if (action === "remove") {
      const n = await Notification.findByIdAndDelete(id)
      await AuditLog.create({
        actor: session.user.id,
        action: "remove_notification",
        targetType: "notification",
        targetId: id,
        reason: body.reason,
      })
      return NextResponse.json({ notification: n })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
