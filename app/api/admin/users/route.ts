import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()
    const q = req.nextUrl.searchParams
    const limit = Math.min(Number(q.get("limit") || "100"), 500)
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "name username email isAdmin isBanned isVerified reportCount premiumPlan lastSeen createdAt",
      )

    return NextResponse.json({ users })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
