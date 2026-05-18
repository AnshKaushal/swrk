import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"
import User from "@/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") || 50)
    const status = url.searchParams.get("status") || "pending"

    const reports = await Notification.find({ type: "report", status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // populate actor and include reported user info from data.reportedUserId
    const userIds: string[] = []
    reports.forEach((r: any) => {
      if (r.actor) userIds.push(String(r.actor))
      if (r.data && r.data.reportedUserId)
        userIds.push(String(r.data.reportedUserId))
    })

    const users = await User.find({ _id: { $in: userIds } })
      .select("name username avatar isBanned")
      .lean()

    const usersMap: Record<string, any> = {}
    users.forEach((u: any) => (usersMap[String(u._id)] = u))

    const out = reports.map((r: any) => ({
      ...r,
      reporter: r.actor ? usersMap[String(r.actor)] : null,
      reportedUser:
        r.data && r.data.reportedUserId
          ? usersMap[String(r.data.reportedUserId)]
          : null,
    }))

    return NextResponse.json({ reports: out })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
