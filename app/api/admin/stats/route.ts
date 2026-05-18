import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import mongoose from "mongoose"
import { User, Notification, UserSubscription } from "@/models"
import VerificationRequest from "@/models/verification-request"
import os from "os"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()

    const totalUsers = await User.countDocuments()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = await User.countDocuments({
      lastSeen: { $gte: thirtyDaysAgo },
    })

    const pendingReports = await Notification.countDocuments({
      type: "report",
      status: "pending",
    })

    const pendingVerifications = await VerificationRequest.countDocuments({
      status: "pending",
    })

    const activeSubscriptions = await UserSubscription.countDocuments({
      status: "active",
    })

    // Database health: ping
    let databaseHealth = 0
    try {
      await db()
      const adminDb = mongoose.connection.db?.admin()
      if (adminDb) {
        const ping = await adminDb.ping()
        databaseHealth = ping?.ok ? 100 : 0
      }
    } catch (e) {
      databaseHealth = 0
    }

    // API uptime in seconds (raw)
    const apiUptimeSeconds = Math.floor(process.uptime())
    // Convert uptime to a percentage of a 24h window (cap at 100%) for UI progress bars
    const apiUptime = Math.min(
      100,
      Math.round((apiUptimeSeconds / (24 * 60 * 60)) * 100),
    )

    // server load (1m avg)
    const load = os.loadavg()[0]
    const cpus = os.cpus().length || 1
    const serverLoad = Math.round((load / cpus) * 100)

    // monthly revenue: sum of subscription amounts with lastPaymentDate this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const revRes = await UserSubscription.aggregate([
      { $match: { lastPaymentDate: { $gte: startOfMonth }, status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const monthlyRevenue = (revRes && revRes[0] && revRes[0].total) || 0

    const avgSessionTime = null
    const bounceRate = null

    const supportTickets = await Notification.countDocuments({
      type: "support",
      status: "pending",
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      pendingReports,
      pendingVerifications,
      activeSubscriptions,
      databaseHealth,
      apiUptime,
      apiUptimeSeconds,
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
