import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import VerificationRequest from "@/models/verification-request"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const requests = await VerificationRequest.find({})
      .sort({ status: 1, createdAt: -1 })
      .limit(200)

    return NextResponse.json({ requests: requests.map((r) => r.toObject()) })
  } catch (err) {
    console.error("[verification/requests GET]", err)
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    )
  }
}
