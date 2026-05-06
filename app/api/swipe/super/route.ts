import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    await db()
    const { getSuperQuota } = await import("@/lib/swipe-limits")
    const quota = await getSuperQuota(session.user.id)
    return NextResponse.json({ quota })
  } catch (err) {
    console.error("[api/swipe/super GET]", err)
    return NextResponse.json({ error: "Failed to fetch super quota" }, { status: 500 })
  }
}
