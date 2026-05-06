import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { useBoost, getBoostQuota } from "@/lib/boosts"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await db()

    const result = await useBoost(session.user.id)
    if (!result.success) {
      return NextResponse.json(
        { error: "Boost limit reached", quota: result.quota },
        { status: 429 },
      )
    }

    return NextResponse.json({ success: true, quota: result.quota })
  } catch (err) {
    console.error("[api/boost/use POST]", err)
    return NextResponse.json({ error: "Failed to use boost" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await db()
    const quota = await getBoostQuota(session.user.id)
    return NextResponse.json({ quota })
  } catch (err) {
    console.error("[api/boost/use GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch boost quota" },
      { status: 500 },
    )
  }
}
