import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

export function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
}

export function getR2Config() {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) return null

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
  }
}

export function getPublicUrl(key: string, bucket: string, endpoint: string) {
  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`
  }

  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`
}

export const uploadToStorage = async ({
  file,
  userId,
  folder,
  allowedTypes,
}: {
  file: {
    buffer: Buffer
    originalname: string
    mimetype: string
    size: number
  }
  userId: string
  folder: string
  allowedTypes: string[]
}) => {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Unsupported file type")
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File too large")
  }

  const safeName = sanitizeFileName(file.originalname || "file")
  const key = `${userId}/${folder}/${Date.now()}-${safeName}`

  const r2 = getR2Config()

  if (r2) {
    const s3 = new S3Client({
      region: "auto",
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    })

    await s3.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    )

    return getPublicUrl(key, r2.bucket, r2.endpoint)
  } else {
    const uploadsRoot = path.join(process.cwd(), "public", "uploads")
    const localPath = path.join(uploadsRoot, key)

    await mkdir(path.dirname(localPath), { recursive: true })
    await writeFile(localPath, file.buffer)

    return `/uploads/${key}`
  }
}

export const deleteFromStorage = async (fileUrl: string): Promise<void> => {
  const r2 = getR2Config()

  if (r2) {
    const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "")

    let key: string

    if (publicBase && fileUrl.startsWith(publicBase)) {
      key = fileUrl.slice(publicBase.length + 1)
    } else {
      const url = new URL(fileUrl)
      key = url.pathname.replace(`/${r2.bucket}/`, "").replace(/^\//, "")
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: r2.endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    })

    await s3.send(
      new DeleteObjectCommand({
        Bucket: r2.bucket,
        Key: key,
      }),
    )
  } else {
    const relativePath = fileUrl.replace(/^\/uploads\//, "")
    const localPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      relativePath,
    )

    await unlink(localPath).catch((err) => {
      if (err.code !== "ENOENT") throw err
    })
  }
}
