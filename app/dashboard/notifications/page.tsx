"use client"

import { useEffect, useRef, useState } from "react"
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

const PAGE_SIZE = 25

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const load = async (options?: { reset?: boolean }) => {
    const reset = options?.reset ?? false
    try {
      if (reset) {
        setLoading(true)
        setSkip(0)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const res = await fetch(
        `/api/notifications?limit=${PAGE_SIZE}&skip=${reset ? 0 : skip}`,
      )
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()

      const nextNotifications = (data.notifications || []) as NotificationItem[]
      setHasMore(Boolean(data.hasMore))
      setNotifications((prev) =>
        reset ? nextNotifications : [...prev, ...nextNotifications],
      )
      setSkip((prev) =>
        reset ? nextNotifications.length : prev + nextNotifications.length,
      )
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void load({ reset: true })
  }, [])

  useEffect(() => {
    const refresh = () => void load({ reset: true })
    window.addEventListener("swrk:notifications-updated", refresh)
    return () =>
      window.removeEventListener("swrk:notifications-updated", refresh)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return

    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || loading) return

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (!entry?.isIntersecting || loadingMore || !hasMore) return
      void load()
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, skip])

  const autoMarked = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = entry.target.getAttribute("data-id")
          if (!id) return
          const notif = notifications.find((n) => n._id === id)
          if (!notif || notif.read) return
          if (autoMarked.current.has(id)) return

          // Optimistically mark as read in UI and remember we've marked it
          autoMarked.current.add(id)
          setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
          )

          // Persist without toasts
          void (async () => {
            try {
              const res = await fetch(`/api/notifications/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read: true }),
              })
              if (!res.ok) {
                console.error(
                  "Failed to auto-mark notification read",
                  await res.text(),
                )
                // revert optimistic update on failure
                setNotifications((prev) =>
                  prev.map((n) => (n._id === id ? { ...n, read: false } : n)),
                )
                autoMarked.current.delete(id)
              }
            } catch (err) {
              console.error(err)
              setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: false } : n)),
              )
              autoMarked.current.delete(id)
            }
          })()
        })
      },
      { threshold: 0.6 },
    )

    notifications.forEach((n) => {
      const el = document.querySelector(`[data-id="${n._id}"]`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [notifications])

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
            data-id={n._id}
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
        <div ref={sentinelRef} className="h-10" />
        {loadingMore ? (
          <div className="py-2 text-sm text-muted-foreground">
            Loading more...
          </div>
        ) : null}
        {!hasMore && notifications.length > 0 ? (
          <div className="py-2 text-sm text-muted-foreground">
            You’re all caught up.
          </div>
        ) : null}
      </div>
    </div>
  )
}
