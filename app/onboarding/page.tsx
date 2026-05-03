"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Check, X, Loader2, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Cropper, { Area } from "react-easy-crop"

type CroppedImageResult = {
  file: File
  url: string
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
): Promise<CroppedImageResult> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.95)
  })

  if (!blob) {
    throw new Error("Failed to crop image")
  }

  return {
    file: new File([blob], fileName, { type: "image/jpeg" }),
    url: URL.createObjectURL(blob),
  }
}

function debounce(
  func: (usernameToCheck: string) => Promise<void>,
  wait: number,
): (usernameToCheck: string) => void {
  let timeout: NodeJS.Timeout
  return (usernameToCheck: string) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(usernameToCheck), wait)
  }
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropPreviewUrlRef = useRef<string | null>(null)

  const [step, setStep] = useState(1)

  // Form State
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [avatar, setAvatar] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState("")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Username validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  )
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const timeout = window.setTimeout(() => {
        setStep(session.user.onboardingStep || 1)
        setName(session.user.name || "")
        setAvatar(session.user.avatar || "")
        setUsername(session.user.username || "")
        setRole(session.user.role || "")
      }, 0)

      return () => window.clearTimeout(timeout)
    }

    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [session, status, router])

  const checkUsernameAvailability = useMemo(
    () =>
      debounce(async (usernameToCheck: string) => {
        if (!usernameToCheck || usernameToCheck.length < 3) {
          setUsernameAvailable(null)
          setUsernameError(null)
          return
        }
        setCheckingUsername(true)
        try {
          const res = await fetch(
            `/api/auth/check-username?username=${encodeURIComponent(usernameToCheck)}`,
          )
          const data = await res.json()
          setUsernameAvailable(data.available)
          setUsernameError(data.error || null)
        } catch {
          setUsernameAvailable(null)
          setUsernameError(null)
        }
        setCheckingUsername(false)
      }, 500),
    [],
  )

  const handleUsernameChange = (value: string) => {
    const safeValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setUsername(safeValue)
    setUsernameAvailable(null)
    setUsernameError(null)
    checkUsernameAvailability(safeValue)
  }

  const handleAvatarUpload = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "avatars")

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setAvatar(data.url)
    } catch {
      toast.error("Failed to upload profile picture")
    }
    setLoading(false)
  }

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels)
    },
    [],
  )

  const handleAvatarFileSelection = (file: File) => {
    if (cropPreviewUrlRef.current) {
      URL.revokeObjectURL(cropPreviewUrlRef.current)
      cropPreviewUrlRef.current = null
    }

    const previewUrl = URL.createObjectURL(file)
    cropPreviewUrlRef.current = previewUrl
    setCropImage(previewUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropOpen(true)
  }

  const handleCropCancel = () => {
    if (cropPreviewUrlRef.current) {
      URL.revokeObjectURL(cropPreviewUrlRef.current)
      cropPreviewUrlRef.current = null
    }

    setCropOpen(false)
    setCropImage("")
    setCroppedAreaPixels(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) {
      toast.error("Adjust the crop before saving")
      return
    }

    try {
      const cropped = await getCroppedImage(
        cropImage,
        croppedAreaPixels,
        "avatar.jpg",
      )
      await handleAvatarUpload(cropped.file)
      toast.success("Profile picture cropped and uploaded successfully!")
    } catch {
      toast.error("Failed to crop profile picture")
    } finally {
      handleCropCancel()
    }
  }

  const handleStepSubmit = async (
    targetStep: number,
    payload: Record<string, unknown>,
    sessionUpdates: Record<string, unknown>,
  ) => {
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, step: targetStep }),
      })
      if (!res.ok) throw new Error("Update failed")

      if (targetStep === 4) {
        toast.success("Profile completed successfully! Welcome to Swrk!")
        await update({ ...sessionUpdates, onboardingStep: targetStep })
        await new Promise((resolve) => setTimeout(resolve, 100))
        router.push("/dashboard")
      } else {
        setStep(targetStep)
        await update({ ...sessionUpdates, onboardingStep: targetStep })
        toast.success("Saved successfully!")
      }
    } catch {
      toast.error("Failed to save information")
    }
    setLoading(false)
  }

  const onNextStep1 = () =>
    handleStepSubmit(
      2,
      { name, username, avatar },
      { name, username, image: avatar },
    )
  const onNextStep2 = () => handleStepSubmit(3, { role }, { role })
  const onNextStep3 = () =>
    handleStepSubmit(
      4,
      { phone, dateOfBirth, gender },
      { onboardingCompleted: true },
    )

  const getAvatarFallback = () => (name ? name.charAt(0).toUpperCase() : "U")

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:flex overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1653447538278-f5f7ade70637?q=80&w=3996&auto=format&fit=crop"
          alt="Onboarding Background"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full w-full">
          <Link href="/">
            <img src="/swrk.svg" alt="Swrk Logo" className="h-10 opacity-90" />
          </Link>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight">
              Your Career <br />
              Starts Here.
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Join Swrk and connect with hiring teams and people open to work
              seamlessly through a profile that truly represents you.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold">{step}/3</div>
              <div className="text-sm font-medium text-white/60 tracking-wider uppercase">
                Steps
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                2<span className="text-xl">m</span>
              </div>
              <div className="text-sm font-medium text-white/60 tracking-wider uppercase">
                Setup
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {step === 1 && "Personal Info"}
              {step === 2 && "Choose Your Role"}
              {step === 3 && "Final Details (Optional)"}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 && "Let's start with the basics to identify you."}
              {step === 2 && "How will you be using Swrk?"}
              {step === 3 &&
                "Tell us a bit more about yourself to help with matching."}
            </p>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-28 w-28 border-4 shadow-xl">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-3xl">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAvatarFileSelection(file)
                  }}
                />
                <p
                  className="text-sm font-medium text-primary hover:underline cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Picture
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="relative">
                    <Input
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="johndoe"
                      className={`h-12 bg-muted/50 border-none pl-10 ${
                        usernameAvailable === true
                          ? "ring-2 ring-green-500/50"
                          : usernameAvailable === false
                            ? "ring-2 ring-destructive/50"
                            : ""
                      }`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      @
                    </span>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive font-medium mt-1">
                      {usernameError || "Username is already taken"}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={onNextStep1}
                className="w-full h-12 text-base font-bold"
                disabled={
                  loading || !name || !username || usernameAvailable === false
                }
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Continue to Next Step"
                )}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-1 gap-4"
              >
                {[
                  {
                    id: "employee",
                    label: "Open to work",
                    desc: "Discover opportunities and apply to roles",
                  },
                  {
                    id: "employer",
                    label: "Hiring",
                    desc: "Post openings and find top talent",
                  },
                  {
                    id: "both",
                    label: "Both",
                    desc: "Open to work and hiring",
                  },
                ].map((r) => (
                  <div key={r.id}>
                    <RadioGroupItem
                      value={r.id}
                      id={r.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={r.id}
                      className="flex flex-col rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="text-base font-bold">{r.label}</span>
                      <span className="text-sm text-muted-foreground mt-1">
                        {r.desc}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep2}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading || !role}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue to Final Step"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    type="date"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-12 bg-muted/50 border-none">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep3}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Complete Profile"
                  )}
                  {!loading && <Check className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}

          {cropOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="text-lg font-semibold tracking-tight">
                    Crop profile picture
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Drag to reposition and zoom to frame your avatar.
                  </p>
                </div>

                <div className="relative h-[420px] w-full bg-black">
                  {cropImage && (
                    <Cropper
                      image={cropImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>

                <div className="space-y-4 border-t border-border px-5 py-4">
                  <div className="space-y-2">
                    <Label>Zoom</Label>
                    <Input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={handleCropCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleCropSave} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save crop"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
