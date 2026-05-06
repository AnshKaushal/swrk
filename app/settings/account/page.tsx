"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AccountSettingsPage() {
  const { status, data: session, update } = useSession()
  const router = useRouter()
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [emailChangeSaving, setEmailChangeSaving] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteRequestSaving, setDeleteRequestSaving] = useState(false)
  const [deleteConfirmSaving, setDeleteConfirmSaving] = useState(false)
  const [deleteOtpSent, setDeleteOtpSent] = useState(false)
  const [deleteOtp, setDeleteOtp] = useState("")
  const [emailForm, setEmailForm] = useState({ newEmail: "" })
  const [usernameForm, setUsernameForm] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  )
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (status === "authenticated") {
      setUsernameForm(session?.user?.username || "")
    }

    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  const checkUsernameAvailability = useMemo(() => {
    let timeout: NodeJS.Timeout | undefined

    return (value: string) => {
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(async () => {
        const nextUsername = value.trim().toLowerCase()
        const currentUsername =
          session?.user?.username?.trim().toLowerCase() || ""

        if (!nextUsername || nextUsername.length < 3) {
          setUsernameAvailable(null)
          setUsernameError(null)
          return
        }

        if (nextUsername === currentUsername) {
          setUsernameAvailable(true)
          setUsernameError(null)
          return
        }

        try {
          const response = await fetch(
            `/api/auth/check-username?username=${encodeURIComponent(nextUsername)}`,
          )
          const data = await response.json()
          setUsernameAvailable(Boolean(data.available))
          setUsernameError(data.error || null)
        } catch {
          setUsernameAvailable(null)
          setUsernameError(null)
        }
      }, 400)
    }
  }, [session?.user?.username])

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const isValidUsername = (value: string) => /^[a-zA-Z0-9_-]{3,20}$/.test(value)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      setPasswordSaving(true)
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Password changed successfully")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextEmail = emailForm.newEmail.trim().toLowerCase()
    const currentEmail = session?.user?.email?.trim().toLowerCase() || ""

    if (!isValidEmail(nextEmail)) {
      toast.error("Enter a valid email address")
      return
    }

    if (nextEmail === currentEmail) {
      toast.error("New email must be different from the current email")
      return
    }

    try {
      setEmailChangeSaving(true)
      const response = await fetch(
        "/api/settings/account/email-change/request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nextEmail }),
        },
      )
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send verification code")
        return
      }

      toast.success("Verification code sent to the new email address")
      router.push(
        `/settings/account/change-email/confirm?email=${encodeURIComponent(nextEmail)}`,
      )
    } catch (error) {
      console.error("Error requesting email change:", error)
      toast.error("Failed to request email change")
    } finally {
      setEmailChangeSaving(false)
    }
  }

  const handleUsernameSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextUsername = usernameForm.trim().toLowerCase()
    const currentUsername = session?.user?.username?.trim().toLowerCase() || ""

    if (!nextUsername) {
      toast.error("Username is required")
      return
    }

    if (!isValidUsername(nextUsername)) {
      toast.error(
        "Username must be 3-20 characters and use only letters, numbers, underscore, or dash",
      )
      return
    }

    if (nextUsername === currentUsername) {
      toast.info("Username is unchanged")
      return
    }

    if (usernameAvailable === false) {
      toast.error(usernameError || "Username is already taken")
      return
    }

    try {
      setUsernameSaving(true)
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: { username: nextUsername } }),
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to update username")
        return
      }

      await update({ username: nextUsername })
      setUsernameForm(nextUsername)
      setUsernameAvailable(true)
      setUsernameError(null)
      toast.success("Username updated successfully")
    } catch (error) {
      console.error("Error updating username:", error)
      toast.error("Failed to update username")
    } finally {
      setUsernameSaving(false)
    }
  }

  const handleDeleteRequest = async () => {
    try {
      setDeleteRequestSaving(true)
      const response = await fetch("/api/settings/account/delete/request", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send deletion code")
        return
      }

      setDeleteOtpSent(true)
      toast.success("A deletion code has been sent to your email")
    } catch (error) {
      console.error("Error requesting account deletion:", error)
      toast.error("Failed to send deletion code")
    } finally {
      setDeleteRequestSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteOtp.trim()) {
      toast.error("Enter the verification code")
      return
    }

    try {
      setDeleteConfirmSaving(true)
      const response = await fetch("/api/settings/account/delete/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOtp.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to delete account")
        return
      }

      toast.success("Your account has been deleted")
      await signOut({ callbackUrl: "/" })
    } catch (error) {
      console.error("Error confirming account deletion:", error)
      toast.error("Failed to delete account")
    } finally {
      setDeleteConfirmSaving(false)
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Account Information</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Update your email address and manage your account access.
          </p>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <form className="space-y-3" onSubmit={handleUsernameSave}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={usernameForm}
                onChange={(e) => {
                  const nextValue = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, "")
                  setUsernameForm(nextValue)
                  setUsernameAvailable(null)
                  setUsernameError(null)
                  checkUsernameAvailability(nextValue)
                }}
                disabled={usernameSaving}
                placeholder="Choose a username"
                className={
                  usernameAvailable === true
                    ? "ring-2 ring-green-500/50"
                    : usernameAvailable === false
                      ? "ring-2 ring-destructive/50"
                      : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                This is your public profile handle.
              </p>
              {usernameError ? (
                <p className="text-xs text-destructive">{usernameError}</p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={
                usernameSaving ||
                !usernameForm.trim() ||
                usernameAvailable === false
              }
            >
              {usernameSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Username"
              )}
            </Button>
          </form>

          <form className="space-y-3" onSubmit={handleEmailChangeRequest}>
            <div className="space-y-2">
              <Label htmlFor="new-email">Change Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter your new email address"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                disabled={emailChangeSaving}
              />
              <p className="text-xs text-muted-foreground">
                We will send a verification code to the new email before
                updating it.
              </p>
            </div>
            <Button type="submit" disabled={emailChangeSaving}>
              {emailChangeSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              type="text"
              value={session?.user?.name || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Edit your profile to change your display name
            </p>
          </div>
        </div>
      </div>

      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">Change Password</h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Update your password to keep your account secure.
          </p>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="md:col-span-2 space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              disabled={passwordSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter your new password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              disabled={passwordSaving}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your new password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              disabled={passwordSaving}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure to use a strong password that you don&apos;t use
              anywhere else.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={passwordSaving || !passwordForm.currentPassword}
          >
            {passwordSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>

      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            Irreversible actions. Please proceed with caution.
          </p>
        </div>
        <div className="md:col-span-2">
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open)
              if (!open) {
                setDeleteOtpSent(false)
                setDeleteOtp("")
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account</DialogTitle>
                <DialogDescription>
                  We will send a one-time code to {session?.user?.email} and
                  delete your account after confirmation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!deleteOtpSent ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteRequest}
                    disabled={deleteRequestSaving}
                  >
                    {deleteRequestSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Deletion Code"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="delete-otp">Verification Code</Label>
                    <Input
                      id="delete-otp"
                      inputMode="numeric"
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value)}
                      placeholder="Enter the code sent to your email"
                    />
                  </div>
                )}
              </div>

              {deleteOtpSent ? (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={deleteConfirmSaving}
                  >
                    {deleteConfirmSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Confirm Deletion"
                    )}
                  </Button>
                </DialogFooter>
              ) : null}
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground mt-2">
            This permanently removes your account and linked profile data.
          </p>
        </div>
      </div>
    </div>
  )
}
