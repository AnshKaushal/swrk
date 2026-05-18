import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import AuditLog from "@/models/audit-log"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    await db()
    const body = await req.json()
    const log = await AuditLog.create({
      actor: session.user.id,
      action: body.action,
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      metadata: body.metadata,
    })
    return NextResponse.json({ log })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
