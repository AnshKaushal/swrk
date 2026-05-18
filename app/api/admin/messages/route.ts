import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Message from "@/models/message"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    await db()
    const recent = await Message.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("sender", "name username")
      .populate({
        path: "match",
        populate: { path: "employer employee", select: "name username" },
      })
    return NextResponse.json({ recent })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
