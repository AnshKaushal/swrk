import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { deleteFromStorage } from "@/lib/storage"
import Resume from "@/models/resume"
import User from "@/models/user"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId } = await params
    await db()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const resume = await Resume.findOne({ _id: resumeId, user: user._id })
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    await deleteFromStorage(resume.url)
    await Resume.deleteOne({ _id: resume._id })

    if (user.featuredResumeId?.toString() === resume._id.toString()) {
      const nextVisible = await Resume.findOne({
        user: user._id,
        isVisibleOnProfile: true,
      }).sort({ createdAt: -1 })

      user.featuredResumeId = nextVisible?._id || null
      await user.save()
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[resumes DELETE]", err)
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 },
    )
  }
}
