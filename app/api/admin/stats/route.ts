import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { User, Notification, Interview, UserSubscription } from "@/models"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()

    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    const pendingReports = await Notification.countDocuments({
      type: "report",
      status: "pending",
    })

    const pendingVerifications = await User.countDocuments({
      verificationStatus: "pending",
    })

    const activeSubscriptions = await UserSubscription.countDocuments({
      status: "active",
    })

    const databaseHealth = 98.5
    const apiUptime = 99.8
    const serverLoad = 45
    const monthlyRevenue = 24500
    const avgSessionTime = "12m 34s"
    const bounceRate = 24
    const supportTickets = 18

    return NextResponse.json({
      totalUsers,
      activeUsers,
      pendingReports,
      pendingVerifications,
      activeSubscriptions,
      databaseHealth,
      apiUptime,
      serverLoad,
      monthlyRevenue,
      avgSessionTime,
      bounceRate,
      supportTickets,
    })
  } catch (error) {
    console.error("Failed to fetch admin stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    )
  }
}
