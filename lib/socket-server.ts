import { Server as SocketIOServer, type Socket } from "socket.io"
import type { Server as HTTPServer } from "http"
import crypto from "crypto"
import { getToken } from "next-auth/jwt"
import { db } from "@/lib/mongodb"
import { Match, Swipe } from "@/models/swipe"

declare global {
  var __mutchSocketServer: SocketIOServer | undefined
  var __mutchPresenceCounts: Map<string, number> | undefined
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

async function canJoinMatch(userId: string, matchId: string) {
  const match = await Match.findOne({
    _id: matchId,
    $or: [{ employer: userId }, { employee: userId }],
    status: "active",
    hiddenBy: { $ne: userId },
  })
    .select("_id")
    .lean()

  if (!match) return false
  return hasMutualLike(matchId)
}

function getPresenceCounts() {
  if (!globalThis.__mutchPresenceCounts) {
    globalThis.__mutchPresenceCounts = new Map<string, number>()
  }

  return globalThis.__mutchPresenceCounts
}

function getOnlineUserIds(excludeUserId?: string) {
  return [...getPresenceCounts().entries()]
    .filter(([, count]) => count > 0)
    .map(([userId]) => userId)
    .filter((userId) => userId !== excludeUserId)
}

function incrementPresence(userId: string) {
  const counts = getPresenceCounts()
  const nextCount = (counts.get(userId) || 0) + 1
  counts.set(userId, nextCount)
  return nextCount
}

function decrementPresence(userId: string) {
  const counts = getPresenceCounts()
  const currentCount = counts.get(userId) || 0
  const nextCount = Math.max(0, currentCount - 1)

  if (nextCount === 0) {
    counts.delete(userId)
  } else {
    counts.set(userId, nextCount)
  }

  return nextCount
}

function getSessionCookieName() {
  return process.env.NEXTAUTH_SECRET
    ? "next-auth.session-token"
    : "next-auth-dev.session-token"
}

function verifySocketToken(rawToken?: unknown) {
  if (typeof rawToken !== "string" || !rawToken) return null

  const parts = rawToken.split(".")
  if (parts.length !== 3) return null

  const [userId, expiresAtText, signature] = parts
  const expiresAt = Number(expiresAtText)
  if (!userId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null
  }

  const secret = process.env.NEXTAUTH_SECRET || ""
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}.${expiresAt}`)
    .digest("hex")

  if (signature.length !== expected.length) return null

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null
  }

  return userId
}

export async function ensureSocketServer(server: HTTPServer) {
  if (globalThis.__mutchSocketServer) {
    ;(server as HTTPServer & { io?: SocketIOServer }).io =
      globalThis.__mutchSocketServer
    return globalThis.__mutchSocketServer
  }

  const io = new SocketIOServer(server, {
    path: "/socket.io",
    addTrailingSlash: false,
    cors: {
      origin: true,
      credentials: true,
    },
  })

  globalThis.__mutchSocketServer = io
  ;(server as HTTPServer & { io?: SocketIOServer }).io = io

  io.on("connection", async (socket: Socket) => {
    try {
      const authUserId = verifySocketToken(socket.handshake.auth?.token)
      const token = authUserId
        ? null
        : await getToken({
            req: socket.request as never,
            secret: process.env.NEXTAUTH_SECRET,
            cookieName: getSessionCookieName(),
            secureCookie: false,
          })

      const userId =
        authUserId ||
        getUserIdFromToken(token as Record<string, unknown> | null)
      if (!userId) {
        socket.disconnect(true)
        return
      }

      socket.data.userId = userId
      socket.join(`user:${userId}`)

      socket.emit("presence:snapshot", {
        userIds: getOnlineUserIds(userId),
      })

      if (incrementPresence(userId) === 1) {
        socket.broadcast.emit("presence:update", { userId, online: true })
      }

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

      socket.on("conversation:join", async (payload: { matchId?: string }) => {
        try {
          const matchId = payload?.matchId
          if (!matchId) return

          if (await canJoinMatch(userId, matchId)) {
            socket.join(`match:${matchId}`)
          }
        } catch (error) {
          console.error("[socket] conversation:join error:", error)
        }
      })

      socket.on("conversation:leave", (payload: { matchId?: string }) => {
        try {
          if (!payload?.matchId) return
          socket.leave(`match:${payload.matchId}`)
        } catch (error) {
          console.error("[socket] conversation:leave error:", error)
        }
      })

      socket.on(
        "typing:start",
        async (payload: { matchId?: string; isTyping?: boolean }) => {
          try {
            if (!payload?.matchId || payload.isTyping === false) return
            if (!(await canJoinMatch(userId, payload.matchId))) return

            socket.to(`match:${payload.matchId}`).emit("typing:update", {
              matchId: payload.matchId,
              userId,
              typing: true,
            })
          } catch (error) {
            console.error("[socket] typing:start error:", error)
          }
        },
      )

      socket.on("typing:stop", async (payload: { matchId?: string }) => {
        try {
          if (!payload?.matchId) return
          if (!(await canJoinMatch(userId, payload.matchId))) return

          socket.to(`match:${payload.matchId}`).emit("typing:update", {
            matchId: payload.matchId,
            userId,
            typing: false,
          })
        } catch (error) {
          console.error("[socket] typing:stop error:", error)
        }
      })

      socket.on("disconnect", () => {
        if (decrementPresence(userId) === 0) {
          socket.broadcast.emit("presence:update", { userId, online: false })
        }
      })
    } catch (error) {
      console.error("[socket] connection error:", error)
      socket.disconnect(true)
    }
  })

  return io
}

export function getSocketServer() {
  return globalThis.__mutchSocketServer ?? null
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  globalThis.__mutchSocketServer?.to(`user:${userId}`).emit(event, payload)
}

export function emitToMatch(matchId: string, event: string, payload: unknown) {
  globalThis.__mutchSocketServer?.to(`match:${matchId}`).emit(event, payload)
}
