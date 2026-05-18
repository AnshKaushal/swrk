import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
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
    if (action === "ban") {
      const reason = body.reason || ""
      const u = await User.findByIdAndUpdate(
        id,
        { isBanned: true, banReason: reason, bannedAt: new Date() },
        { new: true },
      )
      try {
        await AuditLog.create({
          actor: session.user.id,
          action: "ban_user",
          targetType: "user",
          targetId: id,
          reason,
        })
      } catch (err) {
        console.error("audit log failed", err)
      }
      return NextResponse.json({ user: u })
    } else if (action === "unban") {
      const u = await User.findByIdAndUpdate(
        id,
        { isBanned: false, banReason: null, bannedAt: null },
        { new: true },
      )
      try {
        await AuditLog.create({
          actor: session.user.id,
          action: "unban_user",
          targetType: "user",
          targetId: id,
          reason: body.reason || "",
        })
      } catch (err) {
        console.error("audit log failed", err)
      }
      return NextResponse.json({ user: u })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
