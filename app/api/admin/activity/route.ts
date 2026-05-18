import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { User } from "@/models"
import Notification from "@/models/notification"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()

    const range = req.nextUrl.searchParams.get("range") || "7"
    const days = parseInt(range)
    const activity = []

    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayUsers = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      })
      const dayReports = await Notification.countDocuments({
        type: "report",
        createdAt: { $gte: date, $lt: nextDate },
      })

      activity.push({
        day: dayNames[date.getDay()],
        users: dayUsers,
        reports: dayReports,
      })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Failed to fetch activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    )
  }
}
