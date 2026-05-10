import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import { uploadToStorage } from "@/lib/storage"
import Resume from "@/models/resume"
import User from "@/models/user"

const allowedTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

type ResumeUpdateItem = {
  id: string
  title?: string
  isVisibleOnProfile?: boolean
  isFeatured?: boolean
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findOne({ email: session.user.email }).select(
      "_id featuredResumeId",
    )
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const resumes = await Resume.find({ user: user._id }).sort({
      isFeatured: -1,
      createdAt: -1,
    })

    return NextResponse.json({
      resumes: resumes.map((resume) => resume.toObject()),
      featuredResumeId: user.featuredResumeId || null,
    })
  } catch (err) {
    console.error("[resumes GET]", err)
    return NextResponse.json(
      { error: "Failed to load resumes" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = String(formData.get("title") || "Resume").trim() || "Resume"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storageFile = {
      fieldname: "file",
      originalname: file.name,
      encoding: "7bit",
      mimetype: file.type,
      buffer,
      size: file.size,
      destination: "",
      filename: file.name,
      path: "",
      stream: null as unknown as NodeJS.ReadableStream | null,
    }

    const url = await uploadToStorage({
      file: storageFile,
      userId: session.user.id,
      folder: "resumes",
      allowedTypes,
    })

    const currentCount = await Resume.countDocuments({ user: user._id })
    const isVisibleOnProfile = currentCount === 0
    const isFeatured = currentCount === 0

    const resume = await Resume.create({
      user: user._id,
      title,
      url,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      isVisibleOnProfile,
      isFeatured,
    })

    if (isFeatured) {
      user.featuredResumeId = resume._id
      await user.save()
    }

    return NextResponse.json({ resume: resume.toObject() })
  } catch (err) {
    console.error("[resumes POST]", err)
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const updates = Array.isArray(body.resumes)
      ? (body.resumes as ResumeUpdateItem[])
      : []

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No resumes provided" },
        { status: 400 },
      )
    }

    const existingResumes = await Resume.find({ user: user._id })
    const resumeMap = new Map(
      existingResumes.map((resume) => [resume._id.toString(), resume]),
    )

    const featuredCandidate = updates.find((item) => item.isFeatured)
    const featuredResumeId = featuredCandidate?.id || null

    for (const item of updates) {
      const resume = resumeMap.get(String(item.id))
      if (!resume) continue

      resume.title = String(item.title || resume.title).trim() || resume.title
      resume.isVisibleOnProfile = Boolean(item.isVisibleOnProfile)
      resume.isFeatured = Boolean(item.isFeatured)
      await resume.save()
    }

    if (featuredResumeId) {
      await Resume.updateMany(
        { user: user._id, _id: { $ne: featuredResumeId } },
        { $set: { isFeatured: false } },
      )
      user.featuredResumeId = featuredResumeId
      await user.save()
    } else {
      const fallbackFeatured = await Resume.findOne({
        user: user._id,
        isVisibleOnProfile: true,
      }).sort({ createdAt: -1 })

      user.featuredResumeId = fallbackFeatured?._id || null
      await user.save()
    }

    const refreshed = await Resume.find({ user: user._id }).sort({
      isFeatured: -1,
      createdAt: -1,
    })

    return NextResponse.json({
      resumes: refreshed.map((resume) => resume.toObject()),
      featuredResumeId: user.featuredResumeId || null,
    })
  } catch (err) {
    console.error("[resumes PUT]", err)
    return NextResponse.json(
      { error: "Failed to update resumes" },
      { status: 500 },
    )
  }
}
