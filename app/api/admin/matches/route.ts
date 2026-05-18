import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import mongoose from "mongoose"
import { Match } from "@/models/swipe"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()
    const matches = await Match.find()
      .sort({ matchedAt: -1 })
      .limit(50)
      .populate("employer", "name username email")
      .populate("employee", "name username email")

    return NextResponse.json({ matches })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
