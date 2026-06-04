import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Position from "@/models/position"
import PublicApplication from "@/models/public-application"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const { id } = await params

    const position = await Position.findById(id).select("employerId").lean()
    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    if (String(position.employerId) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(_req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const skip = (page - 1) * limit

    const filter = { positionId: id }
    const [applications, total] = await Promise.all([
      PublicApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PublicApplication.countDocuments(filter),
    ])

    return NextResponse.json({ applications, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    )
  }
}
