import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { emitToMatch, getSocketServer } from "@/lib/socket-server"
import { Match, Swipe } from "@/models/swipe"

function extractObjectId(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? "")
  }
  return String(value)
}

async function isMutualMatch(match: {
  employer?: unknown
  employee?: unknown
}) {
  const employerId = extractObjectId(match.employer)
  const employeeId = extractObjectId(match.employee)

  const [employerSwipe, employeeSwipe] = await Promise.all([
    Swipe.findOne({
      swipedBy: employerId,
      swipedOn: employeeId,
      direction: { $in: ["right", "super"] },
    })
      .select("_id")
      .lean(),
    Swipe.findOne({
      swipedBy: employeeId,
      swipedOn: employerId,
      direction: { $in: ["right", "super"] },
    })
      .select("_id")
      .lean(),
  ])

  return Boolean(employerSwipe && employeeSwipe)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const typing = Boolean(body?.typing)

    const match = await Match.findOne({
      _id: id,
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status: "active",
      hiddenBy: { $ne: session.user.id },
    })
      .select("employer employee")
      .lean()

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    if (typing) {
      await Match.updateOne(
        { _id: id },
        {
          $addToSet: { typingUsers: session.user.id },
          $set: { typingUpdatedAt: new Date() },
        },
      )
    } else {
      await Match.updateOne(
        { _id: id },
        {
          $pull: { typingUsers: session.user.id },
          $set: { typingUpdatedAt: new Date() },
        },
      )
    }

    if (getSocketServer()) {
      emitToMatch(id, "typing:update", {
        matchId: id,
        userId: session.user.id,
        typing,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/matches/[id]/typing POST]", error)
    return NextResponse.json(
      { error: "Failed to update typing state" },
      { status: 500 },
    )
  }
}

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
    const match = await Match.findOne({
      _id: id,
      $or: [{ employer: session.user.id }, { employee: session.user.id }],
      status: "active",
      hiddenBy: { $ne: session.user.id },
    })
      .select("employer employee typingUsers typingUpdatedAt")
      .lean()

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    if (!(await isMutualMatch(match))) {
      return NextResponse.json(
        { error: "Chat unlocks only after both users like each other" },
        { status: 403 },
      )
    }

    return NextResponse.json({
      matchId: id,
      typingUsers: (match.typingUsers || []).map((userId: string) =>
        String(userId),
      ),
      typingUpdatedAt: match.typingUpdatedAt || null,
    })
  } catch (error) {
    console.error("[api/matches/[id]/typing GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch typing state" },
      { status: 500 },
    )
  }
}
