import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"
import User from "@/models/user"
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
    const reason = body.reason || ""

    const notif = await Notification.findById(id).lean()
    if (!notif || notif.type !== "report") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const reportedUserId = notif.data?.reportedUserId
    if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return NextResponse.json(
        { error: "Reported user not found" },
        { status: 400 },
      )
    }

    if (action === "ban") {
      const u = await User.findByIdAndUpdate(
        reportedUserId,
        { isBanned: true, banReason: reason, bannedAt: new Date() },
        { new: true },
      )
      await Notification.updateOne(
        { _id: id },
        { $set: { status: "reviewed" } },
      )
      try {
        await AuditLog.create({
          actor: session.user.id,
          action: "ban_user_from_report",
          targetType: "user",
          targetId: reportedUserId,
          reason,
          metadata: { notificationId: id },
        })
      } catch (err) {
        console.error("audit log failed", err)
      }
      return NextResponse.json({ ok: true, user: u })
    } else if (action === "warn") {
      // create a warning notification to the reported user
      await Notification.create({
        user: reportedUserId,
        actor: session.user.id,
        type: "warning",
        status: "pending",
        title: "Warning from admin",
        message: body.message || "Please adhere to community guidelines.",
        data: { reason },
      })
      await Notification.updateOne(
        { _id: id },
        { $set: { status: "reviewed" } },
      )
      try {
        await AuditLog.create({
          actor: session.user.id,
          action: "warn_user_from_report",
          targetType: "user",
          targetId: reportedUserId,
          reason,
          metadata: { notificationId: id },
        })
      } catch (err) {
        console.error("audit log failed", err)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
