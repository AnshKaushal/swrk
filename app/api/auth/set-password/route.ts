import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json()

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      )
    }

    await db()

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email first" },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate default avatar if not set
    const avatar =
      user.avatar ||
      `https://dummyimage.com/200x200/0a0a0a/efefef?text=${name.charAt(0).toUpperCase()}`

    await User.findByIdAndUpdate(user._id, {
      $set: {
        name: name.trim(),
        password: hashedPassword,
        avatar,
        onboardingStep: Math.max(user.onboardingStep, 1),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[set-password]", err)
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 },
    )
  }
}
