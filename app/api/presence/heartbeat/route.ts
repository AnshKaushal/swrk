import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const body = await req.json().catch(() => ({}))
    const online = body?.online !== false

    await User.updateOne(
      { _id: session.user.id },
      {
        $set: {
          isOnline: online,
          lastSeen: new Date(),
        },
      },
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/presence/heartbeat POST]", error)
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 },
    )
  }
}
