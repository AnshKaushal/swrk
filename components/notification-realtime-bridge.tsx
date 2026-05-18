"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import type { Socket } from "socket.io-client"
import { getSocketClient } from "@/lib/socket-client"

export default function NotificationRealtimeBridge() {
  const { status } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | null = null

    const bootstrap = async () => {
      if (status !== "authenticated") return

      try {
        const socket = await getSocketClient()
        if (cancelled) return

        socketRef.current = socket

        const handleNotification = () => {
          try {
            window.dispatchEvent(new Event("mutch:notifications-updated"))
          } catch {
            // ignore
          }
        }

        const handleDisconnect = () => {
          try {
            window.dispatchEvent(new Event("mutch:notifications-updated"))
          } catch {
            // ignore
          }
        }

        socket.off("notification:new", handleNotification)
        socket.off("disconnect", handleDisconnect)
        socket.on("notification:new", handleNotification)
        socket.on("disconnect", handleDisconnect)

        cleanup = () => {
          socket.off("notification:new", handleNotification)
          socket.off("disconnect", handleDisconnect)
        }
      } catch (error) {
        console.error("notification bridge bootstrap failed", error)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      cleanup?.()
      socketRef.current = null
    }
  }, [status])

  return null
}
