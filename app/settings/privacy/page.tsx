"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Privacy {
  showLinkedin: boolean
  showPhone: boolean
  showEmail: boolean
  profileVisibility: string
}

const defaultPrivacy: Privacy = {
  showLinkedin: false,
  showPhone: false,
  showEmail: true,
  profileVisibility: "public",
}

export default function PrivacySettingsPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [privacy, setPrivacy] = useState<Privacy>(defaultPrivacy)

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setPrivacy(data.privacy || defaultPrivacy)
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error)
      toast.error("Failed to load privacy settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchPrivacySettings()
    }
  }, [status])

  const updatePrivacy = (updates: Partial<Privacy>) => {
    setPrivacy((prev) => ({ ...prev, ...updates }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy }),
      })

      if (response.ok) {
        toast.success("Privacy settings updated")
      } else {
        toast.error("Failed to update privacy settings")
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      toast.error("Failed to update privacy settings")
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
          <h2 className="text-base/7 font-semibold">Profile Visibility</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Control who can see your information and contact you.
          </p>
        </div>

        <div className="md:col-span-2 space-y-6 rounded-xl border border-border p-4 h-fit">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show LinkedIn Profile</Label>
              <p className="text-sm text-muted-foreground">
                Let others see your LinkedIn profile link after matching
              </p>
            </div>
            <Switch
              checked={privacy.showLinkedin}
              onCheckedChange={(checked) =>
                updatePrivacy({ showLinkedin: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                Let others see your phone number on your profile
              </p>
            </div>
            <Switch
              checked={privacy.showPhone}
              onCheckedChange={(checked) =>
                updatePrivacy({ showPhone: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Email Address</Label>
              <p className="text-sm text-muted-foreground">
                Let others see your email address on your profile
              </p>
            </div>
            <Switch
              checked={privacy.showEmail}
              onCheckedChange={(checked) =>
                updatePrivacy({ showEmail: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={privacy.profileVisibility}
              onValueChange={(value) =>
                updatePrivacy({ profileVisibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  Public - Visible to everyone
                </SelectItem>
                <SelectItem value="verified-only">
                  Verified Only - Visible to verified users only
                </SelectItem>
                <SelectItem value="hidden">
                  Hidden - Hidden from public
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile on the platform
            </p>
          </div>
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
