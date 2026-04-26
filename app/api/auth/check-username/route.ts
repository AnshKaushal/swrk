import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      )
    }

    // Validate username format (alphanumeric, underscore, dash, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        error: "Invalid username format",
      })
    }

    await db()

    // Check if username exists (excluding current user)
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: session.user.id }, // Exclude current user
    })

    return NextResponse.json({
      available: !existingUser,
      username: username.toLowerCase(),
    })
  } catch (error) {
    console.error("Error checking username:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
