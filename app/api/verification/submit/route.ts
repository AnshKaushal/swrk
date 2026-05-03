import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import VerificationRequest from "@/models/verification-request"
import { uploadToStorage } from "@/lib/storage"

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const formData = await req.formData()
    const type = String(formData.get("type") || "identity")
    const fullName = String(formData.get("fullName") || "")
    const linkedinUrl = String(formData.get("linkedinUrl") || "")
    const companyName = String(formData.get("companyName") || "")
    const companyWebsite = String(formData.get("companyWebsite") || "")
    const description = String(formData.get("description") || "")
    const files = formData.getAll("documents") as File[]

    const documents: Array<{ url: string; name: string; type: string }> = []

    for (const file of files) {
      if (!file || !allowedTypes.includes(file.type)) continue

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
        stream: null as any,
      }

      const url = await uploadToStorage({
        file: storageFile,
        userId: session.user.id,
        folder: "verifications",
        allowedTypes,
      })

      documents.push({ url, name: file.name, type: file.type })
    }

    const existing = await VerificationRequest.findOne({
      user: session.user.id,
    })

    const requestPayload = {
      user: session.user.id,
      type,
      fullName,
      linkedinUrl,
      companyName,
      companyWebsite,
      description,
      documents,
      status: "pending" as const,
    }

    if (existing && existing.status === "pending") {
      existing.fullName = fullName || existing.fullName
      existing.linkedinUrl = linkedinUrl || existing.linkedinUrl
      existing.companyName = companyName || existing.companyName
      existing.companyWebsite = companyWebsite || existing.companyWebsite
      existing.description = description || existing.description
      existing.documents = [...(existing.documents || []), ...documents]
      await existing.save()
      return NextResponse.json({ success: true, request: existing.toObject() })
    }

    const request = await VerificationRequest.create(requestPayload)

    return NextResponse.json({ success: true, request: request.toObject() })
  } catch (err) {
    console.error("[verification/submit]", err)
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 },
    )
  }
}
