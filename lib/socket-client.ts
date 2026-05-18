"use client"

import { io, type Socket } from "socket.io-client"

declare global {
  var __mutchSocketClient: Socket | undefined
  var __mutchSocketInitPromise: Promise<Socket> | undefined
}

async function ensureSocketServer() {
  await fetch("/api/socket", { cache: "no-store" })
}

async function fetchSocketToken() {
  const response = await fetch("/api/socket-token", {
    cache: "no-store",
    credentials: "include",
  })

  if (!response.ok) {
    return null
  }

  const json = (await response.json()) as { token?: string }
  return json.token || null
}

export async function getSocketClient() {
  if (globalThis.__mutchSocketClient) {
    return globalThis.__mutchSocketClient
  }

  if (!globalThis.__mutchSocketInitPromise) {
    globalThis.__mutchSocketInitPromise = (async () => {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      if (socketUrl === window.location.origin) {
        await ensureSocketServer()
      }

      const token = await fetchSocketToken()

      const socket = io(socketUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: token ? { token } : undefined,
      })

      socket.on("connect_error", (error) => {
        console.error("[socket] connect error:", error)
      })

      globalThis.__mutchSocketClient = socket

      socket.on("disconnect", () => {
        if (socket.disconnected) {
          globalThis.__mutchSocketClient = socket
        }
      })

      return socket
    })()
  }

  return globalThis.__mutchSocketInitPromise
}

export function getExistingSocketClient() {
  return globalThis.__mutchSocketClient ?? null
}
