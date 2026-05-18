import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { Swipe } from "@/models/swipe"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db()

    const recent = await Swipe.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("swipedBy", "name username")
      .populate("swipedOn", "name username")

    const counts = await Swipe.aggregate([
      { $group: { _id: "$direction", count: { $sum: 1 } } },
    ])

    return NextResponse.json({ recent, counts })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
