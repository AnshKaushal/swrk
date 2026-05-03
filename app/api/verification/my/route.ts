import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import VerificationRequest from "@/models/verification-request"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const request = await VerificationRequest.findOne({
      user: session.user.id,
    }).sort({ createdAt: -1 })

    return NextResponse.json({ request: request?.toObject() || null })
  } catch (err) {
    console.error("[verification/my GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch verification" },
      { status: 500 },
    )
  }
}
