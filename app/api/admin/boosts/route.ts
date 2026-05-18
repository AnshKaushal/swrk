import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import BoostUsage from "@/models/boost"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    await db()
    const recent = await BoostUsage.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name username")
    const total = await BoostUsage.countDocuments()
    return NextResponse.json({ recent, total })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
