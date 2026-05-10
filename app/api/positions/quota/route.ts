import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { getJobPostQuota } from "@/lib/job-posting-limits"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const quota = await getJobPostQuota(session.user.id)

    return NextResponse.json({
      quota: {
        allowed: quota.allowed,
        used: quota.used,
        remaining: quota.remaining,
        limit: quota.limit,
        isUnlimited: quota.isUnlimited,
        planName: quota.planName,
      },
    })
  } catch (error) {
    console.error("[api/positions/quota GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch quota" },
      { status: 500 },
    )
  }
}
