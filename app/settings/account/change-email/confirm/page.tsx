"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

function ConfirmEmailChangeContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pendingEmail = searchParams.get("email") || ""
  const [saving, setSaving] = useState(false)
  const [otp, setOtp] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp.trim()) {
      toast.error("Enter the verification code")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(
        "/api/settings/account/email-change/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: otp.trim() }),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to confirm email change")
        return
      }

      toast.success("Email updated successfully")
      await signOut({ callbackUrl: "/signin?email-updated=1" })
    } catch (error) {
      console.error("Error confirming email change:", error)
      toast.error("Failed to confirm email change")
    } finally {
      setSaving(false)
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm new email</CardTitle>
          <CardDescription>
            Enter the verification code sent to{" "}
            {pendingEmail || "your new email"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleConfirm}>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit code"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Email Change"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ConfirmEmailChangeContent />
    </Suspense>
  )
}
