import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { uploadToStorage } from "@/lib/storage"

const allowedTypes = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || "anonymous"

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PDF, DOC, DOCX, TXT" },
        { status: 400 },
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB" },
        { status: 400 },
      )
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
      userId,
      folder: "resumes",
      allowedTypes,
    })

    return NextResponse.json({ url, fileName: file.name })
  } catch (err) {
    console.error("[upload-resume]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
