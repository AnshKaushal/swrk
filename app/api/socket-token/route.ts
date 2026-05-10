import crypto from "crypto"
import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"

const SOCKET_TOKEN_TTL_MS = 30 * 60 * 1000

function signSocketToken(userId: string, expiresAt: number) {
  const secret = process.env.NEXTAUTH_SECRET || ""
  const payload = `${userId}.${expiresAt}`
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return `${payload}.${signature}`
}

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expiresAt = Date.now() + SOCKET_TOKEN_TTL_MS
    return NextResponse.json({
      token: signSocketToken(userId, expiresAt),
      expiresAt,
    })
  } catch (error) {
    console.error("[socket-token GET]", error)
    return NextResponse.json(
      { error: "Failed to create socket token" },
      { status: 500 },
    )
  }
}
