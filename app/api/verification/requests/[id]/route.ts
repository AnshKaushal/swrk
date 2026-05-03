import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import VerificationRequest from "@/models/verification-request"
import User from "@/models/user"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { id } = await params
    const body = await req.json()
    const action = body?.action
    const note = body?.note || ""

    const request = await VerificationRequest.findById(id)
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (action === "approve") {
      request.status = "approved"
      request.admin = session.user.id
      request.adminNote = note
      request.reviewedAt = new Date()
      await request.save()

      // mark user's profileVerified flag
      await User.findByIdAndUpdate(request.user, { profileVerified: true })
    } else if (action === "reject") {
      request.status = "rejected"
      request.admin = session.user.id
      request.adminNote = note
      request.reviewedAt = new Date()
      await request.save()

      await User.findByIdAndUpdate(request.user, { profileVerified: false })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, request: request.toObject() })
  } catch (err) {
    console.error("[verification/requests/:id PATCH]", err)
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    )
  }
}
