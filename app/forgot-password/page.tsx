"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type Step = "email" | "otp" | "password"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sendResetCode = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code")
      }

      toast.success(data.message || "Reset code sent")
      setStep("otp")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset code",
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyResetCode = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the reset code")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      toast.success(data.message || "Password updated successfully")
      router.push("/signin")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-black tracking-tight">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify Reset Code"}
            {step === "password" && "Set New Password"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "email" &&
              "Enter your email and we’ll send a reset code."}
            {step === "otp" && "Enter the code we emailed to you."}
            {step === "password" && "Choose a new password for your account."}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === "email" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-11"
                disabled={loading}
              />
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-2">
              <Label htmlFor="otp">Reset Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="h-11 tracking-[0.4em]"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                If you don’t see it, check spam or request a new code.
              </p>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-3">
            {step === "email" && (
              <Button
                className="w-full"
                onClick={sendResetCode}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </Button>
            )}

            {step === "otp" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11"
                    disabled={loading}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={verifyResetCode}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </>
            )}

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/signin"
                className="font-medium text-primary hover:underline"
              >
                Back to sign in
              </Link>
              {step === "otp" && (
                <button
                  type="button"
                  onClick={() => void sendResetCode()}
                  className="font-medium text-primary hover:underline"
                  disabled={loading}
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
