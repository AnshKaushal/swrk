"use client"

import { io, type Socket } from "socket.io-client"

declare global {
  var __swrkSocketClient: Socket | undefined
  var __swrkSocketInitPromise: Promise<Socket> | undefined
}

async function ensureSocketServer() {
  await fetch("/api/socket", { cache: "no-store" })
}

export async function getSocketClient() {
  if (globalThis.__swrkSocketClient) {
    return globalThis.__swrkSocketClient
  }

  if (!globalThis.__swrkSocketInitPromise) {
    globalThis.__swrkSocketInitPromise = (async () => {
      await ensureSocketServer()

      const socket = io(window.location.origin, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      socket.on("connect_error", (error) => {
        console.error("[socket] connect error:", error)
      })

      globalThis.__swrkSocketClient = socket

      socket.on("disconnect", () => {
        if (socket.disconnected) {
          globalThis.__swrkSocketClient = socket
        }
      })

      return socket
    })()
  }

  return globalThis.__swrkSocketInitPromise
}

export function getExistingSocketClient() {
  return globalThis.__swrkSocketClient ?? null
}
