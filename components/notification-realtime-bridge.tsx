"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { io, type Socket } from "socket.io-client"

export default function NotificationRealtimeBridge() {
  const { status } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (status !== "authenticated") return

      try {
        await fetch("/api/socket", { cache: "no-store" })
        if (cancelled || socketRef.current) return

        const socket = io({
          path: "/socket.io",
          transports: ["websocket", "polling"],
          withCredentials: true,
        })

        socketRef.current = socket

        socket.on("notification:new", () => {
          try {
            window.dispatchEvent(new Event("swrk:notifications-updated"))
          } catch {
            // ignore
          }
        })

        socket.on("disconnect", () => {
          try {
            window.dispatchEvent(new Event("swrk:notifications-updated"))
          } catch {
            // ignore
          }
        })
      } catch (error) {
        console.error("notification bridge bootstrap failed", error)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [status])

  return null
}
