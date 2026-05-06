import { Server as SocketIOServer, type Socket } from "socket.io"
import type { Server as HTTPServer } from "http"
import { getToken } from "next-auth/jwt"
import { db } from "@/lib/mongodb"
import { Match, Swipe } from "@/models/swipe"

declare global {
  var __swrkSocketServer: SocketIOServer | undefined
}

function getUserIdFromToken(token: Record<string, unknown> | null) {
  if (!token) return null

  const candidate =
    token.sub ||
    token.id ||
    token.userId ||
    (token.user as { id?: string } | undefined)?.id

  return typeof candidate === "string" ? candidate : null
}

async function hasMutualLike(matchId: string) {
  const match = await Match.findById(matchId)
    .select("employer employee status")
    .lean()
  if (!match || match.status !== "active") return false

  const employerId = String(match.employer)
  const employeeId = String(match.employee)

  const [employerSwipe, employeeSwipe] = await Promise.all([
    Swipe.findOne({
      swipedBy: employerId,
      swipedOn: employeeId,
      direction: { $in: ["right", "super"] },
    })
      .select("_id")
      .lean(),
    Swipe.findOne({
      swipedBy: employeeId,
      swipedOn: employerId,
      direction: { $in: ["right", "super"] },
    })
      .select("_id")
      .lean(),
  ])

  return Boolean(employerSwipe && employeeSwipe)
}

export async function ensureSocketServer(server: HTTPServer) {
  if (globalThis.__swrkSocketServer) {
    return globalThis.__swrkSocketServer
  }

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    addTrailingSlash: false,
    cors: {
      origin: true,
      credentials: true,
    },
  })

  globalThis.__swrkSocketServer = io

  io.on("connection", async (socket: Socket) => {
    const token = await getToken({
      req: socket.request as never,
      secret: process.env.NEXTAUTH_SECRET,
    })

    const userId = getUserIdFromToken(token as Record<string, unknown> | null)
    if (!userId) {
      socket.disconnect(true)
      return
    }

    socket.data.userId = userId
    socket.join(`user:${userId}`)

    await db()

    const matches = await Match.find({
      $or: [{ employer: userId }, { employee: userId }],
      status: "active",
    })
      .select("_id")
      .lean()

    for (const match of matches) {
      if (await hasMutualLike(String(match._id))) {
        socket.join(`match:${match._id}`)
      }
    }

    socket.emit("socket:ready", { userId })
    socket.broadcast.emit("presence:update", { userId, online: true })

    socket.on("disconnect", () => {
      socket.broadcast.emit("presence:update", { userId, online: false })
    })
  })

  return io
}

export function getSocketServer() {
  return globalThis.__swrkSocketServer ?? null
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  globalThis.__swrkSocketServer?.to(`user:${userId}`).emit(event, payload)
}

export function emitToMatch(matchId: string, event: string, payload: unknown) {
  globalThis.__swrkSocketServer?.to(`match:${matchId}`).emit(event, payload)
}
