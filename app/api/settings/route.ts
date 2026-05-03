import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()
    const user = await User.findById(session.user.id).select(
      "-password -verificationToken -passwordResetToken -reports",
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user settings in the expected format
    const settings = {
      name: user.name || "",
      username: user.username || "",
      avatar: user.avatar || "",
      banner: user.banner || "",
      phone: user.phone || "",
      address: user.address || {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : "",
      gender: user.gender || "",
      linkedinUrl: user.linkedinUrl || "",
      githubUrl: user.githubUrl || "",
      portfolioUrl: user.portfolioUrl || "",
      privacy: {
        showLinkedin: user.privacy?.showLinkedin || false,
        showPhone: user.privacy?.showPhone || false,
        showEmail: user.privacy?.showEmail ?? true,
        profileVisibility: user.privacy?.profileVisibility || "public",
      },
      notifications: {
        email: {
          newMatch: user.notifications?.email?.newMatch ?? true,
          newMessage: user.notifications?.email?.newMessage ?? true,
          profileViewed: user.notifications?.email?.profileViewed ?? true,
          weeklyDigest: user.notifications?.email?.weeklyDigest ?? true,
          promotions: user.notifications?.email?.promotions ?? false,
        },
        push: {
          newMatch: user.notifications?.push?.newMatch ?? true,
          newMessage: user.notifications?.push?.newMessage ?? true,
          profileViewed: user.notifications?.push?.profileViewed ?? false,
          reminders: user.notifications?.push?.reminders ?? true,
        },
      },
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await req.json()
    await db()

    // Validate username uniqueness if being updated
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username.toLowerCase(),
        _id: { $ne: session.user.id },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        )
      }
    }

    // Prepare update object
    const updateData: any = {}

    // Basic profile fields
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.username !== undefined)
      updateData.username = updates.username.toLowerCase()
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.dateOfBirth !== undefined)
      updateData.dateOfBirth = updates.dateOfBirth
        ? new Date(updates.dateOfBirth)
        : null
    if (updates.gender !== undefined) updateData.gender = updates.gender
    if (updates.linkedinUrl !== undefined)
      updateData.linkedinUrl = updates.linkedinUrl
    if (updates.githubUrl !== undefined)
      updateData.githubUrl = updates.githubUrl
    if (updates.portfolioUrl !== undefined)
      updateData.portfolioUrl = updates.portfolioUrl

    // Privacy settings
    if (updates.privacy) {
      updateData.privacy = {
        ...updateData.privacy,
        ...updates.privacy,
      }
    }

    // Notification settings
    if (updates.notifications) {
      updateData.notifications = {
        ...updateData.notifications,
        ...updates.notifications,
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password -verificationToken -passwordResetToken -reports")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating settings:", error)

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      )
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    )
  }
}
