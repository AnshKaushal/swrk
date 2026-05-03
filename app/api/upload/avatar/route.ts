import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { uploadToStorage } from "@/lib/storage"
import { db } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const kind = String(formData.get("kind") || "avatar")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Convert File to Express.Multer.File-like object
    const buffer = Buffer.from(await file.arrayBuffer())
    const multerFile = {
      fieldname: "file",
      originalname: file.name,
      encoding: "7bit",
      mimetype: file.type,
      buffer,
      size: file.size,
      destination: "",
      filename: file.name,
      path: "",
      stream: null as any,
    }

    const url = await uploadToStorage({
      file: multerFile,
      userId: session.user.id,
      folder: kind === "banner" ? "banners" : "avatars",
      allowedTypes,
    })

    await User.findByIdAndUpdate(session.user.id, {
      [kind === "banner" ? "banner" : "avatar"]: url,
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error("[upload-avatar]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
