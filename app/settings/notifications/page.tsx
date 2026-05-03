"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Notifications {
  email: {
    newMatch: boolean
    newMessage: boolean
    profileViewed: boolean
    weeklyDigest: boolean
    promotions: boolean
  }
  push: {
    newMatch: boolean
    newMessage: boolean
    profileViewed: boolean
    reminders: boolean
  }
}

const notificationDescriptions: Record<string, string> = {
  newMatch: "When someone matches with you",
  newMessage: "When you receive a new message",
  profileViewed: "When someone views your profile",
  weeklyDigest: "Weekly summary of your activity",
  promotions: "Promotional offers and updates",
  reminders: "Reminders to complete your profile or check matches",
}

const defaultNotifications: Notifications = {
  email: {
    newMatch: true,
    newMessage: true,
    profileViewed: true,
    weeklyDigest: true,
    promotions: false,
  },
  push: {
    newMatch: true,
    newMessage: true,
    profileViewed: false,
    reminders: true,
  },
}

export default function NotificationsSettingsPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] =
    useState<Notifications>(defaultNotifications)

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || defaultNotifications)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notification settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchNotifications()
    }
  }, [status])

  const updateNotifications = (
    type: "email" | "push",
    key: string,
    value: boolean,
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      })

      if (response.ok) {
        toast.success("Notification settings updated")
      } else {
        toast.error("Failed to update notification settings")
      }
    } catch (error) {
      console.error("Error updating notifications:", error)
      toast.error("Failed to update notification settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col divide-y divide-border">
      <div className="grid max-w-7xl flex-1 grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Email Notifications</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Choose what emails you&apos;d like to receive.
          </p>
        </div>
        <div className="md:col-span-2 space-y-6 rounded-xl border border-border p-4 h-fit">
          {Object.entries(notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {notificationDescriptions[key]}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  updateNotifications(
                    "email",
                    key as keyof Notifications["email"],
                    checked,
                  )
                }
                disabled={saving}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid max-w-7xl flex-1 grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Push Notifications</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Choose what push notifications you&apos;d like to receive.
          </p>
        </div>
        <div className="md:col-span-2 space-y-6 rounded-xl border border-border p-4 h-fit">
          {Object.entries(notifications.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {notificationDescriptions[key]}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  updateNotifications(
                    "push",
                    key as keyof Notifications["push"],
                    checked,
                  )
                }
                disabled={saving}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex justify-start">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
