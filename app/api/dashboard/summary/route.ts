import { auth } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import Notification from "@/models/notification"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const [unreadNotifications, activeRoleDoc] = await Promise.all([
      Notification.countDocuments({
        user: session.user.id,
        read: false,
      }),
      session.user.role === "both"
        ? fetch(
            new URL(
              "/api/profile/me",
              process.env.NEXTAUTH_URL || "http://localhost:3000",
            ),
            {
              headers: {
                Cookie: `next-auth.session-token=${session.user.id}`,
              },
            },
          )
            .then((r) => r.json())
            .catch(() => ({ activeRole: "employee" }))
        : Promise.resolve({ activeRole: session.user.role }),
    ])

    return NextResponse.json({
      unreadNotifications,
      activeRole: activeRoleDoc?.activeRole || "employee",
      role: session.user.role,
    })
  } catch (error) {
    console.error("Dashboard summary error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 },
    )
  }
}
