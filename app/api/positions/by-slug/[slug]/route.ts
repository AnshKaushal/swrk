import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await db()
    const { slug } = await params

    const position = await Position.findOne({ slug, status: "active", isVisible: true })
      .populate("employerId", "name avatar companyName")
      .lean()

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 },
    )
  }
}
