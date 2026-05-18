import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import UserSubscription from "@/models/user-subscription"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    await db()
    const subs = await UserSubscription.find()
      .sort({ lastPaymentDate: -1 })
      .limit(100)
      .populate("user", "name username email")
    const revenue = await UserSubscription.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    return NextResponse.json({ subs, revenue: revenue[0]?.total || 0 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
