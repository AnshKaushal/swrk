"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

interface NotificationItem {
  _id: string
  title?: string
  message?: string
  link?: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?limit=200`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const refresh = () => void load()
    window.addEventListener("swrk:notifications-updated", refresh)
    return () =>
      window.removeEventListener("swrk:notifications-updated", refresh)
  }, [])

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to mark as read")
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      )
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to mark read")
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-4xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Link
          href="/settings/notifications"
          className="text-sm text-muted-foreground"
        >
          Notification Settings
        </Link>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <p className="text-muted-foreground">No notifications</p>
        )}
        {notifications.map((n) => (
          <div
            key={n._id}
            className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${n.read ? "bg-background" : "bg-muted/5"}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium">{n.title || "Update"}</h3>
                {!n.read && <Badge>New</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
              <div className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {n.link ? (
                <Link href={n.link} className="text-sm text-primary">
                  View
                </Link>
              ) : null}
              {!n.read && (
                <Button size="sm" onClick={() => void markRead(n._id)}>
                  Mark read
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
