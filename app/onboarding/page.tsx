"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Camera,
  Check,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "lucide-react"
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

const parseYear = (value?: string | null) => {
  if (!value) return null
  const year = Number.parseInt(value, 10)
  return Number.isFinite(year) ? year : null
}

const isValidPhone = (v?: string) => {
  if (!v) return false
  return /^\+?[0-9\-()\s]{7,20}$/.test(v)
}

const isValidDateISO = (v?: string) => {
  if (!v) return false
  const d = new Date(v)
  return !Number.isNaN(d.getTime())
}

const isValidYear = (v?: string) => {
  if (!v) return false
  const y = Number.parseInt(v, 10)
  return Number.isFinite(y) && y > 1900 && y < 3000
}

const isPositiveNumberString = (v?: string) => {
  if (!v) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= 0
}

const isValidUrl = (v?: string) => {
  if (!v) return false
  try {
    new URL(v)
    return true
  } catch {
    return false
  }
}

const getAvatarFallback = (fullName?: string) => {
  return fullName ? fullName.charAt(0).toUpperCase() : "U"
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropPreviewUrlRef = useRef<string | null>(null)
  const hasHydratedRef = useRef(false)

  const TOTAL_STEPS = 7
  const [step, setStep] = useState(1)

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [avatar, setAvatar] = useState("")
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [education, setEducation] = useState([
    { school: "", degree: "", field: "", year: "", endYear: "" },
  ])
  const [workHistory, setWorkHistory] = useState([
    {
      company: "",
      position: "",
      duration: "",
      endYear: "",
      isCurrent: false,
      description: "",
    },
  ])
  const [projects, setProjects] = useState([
    { title: "", description: "", url: "" },
  ])
  const [desiredRoles, setDesiredRoles] = useState<string[]>([])
  const [desiredIndustries, setDesiredIndustries] = useState<string[]>([])
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])
  const [preferredLocationInput, setPreferredLocationInput] = useState("")
  const [expectedCTCMin, setExpectedCTCMin] = useState("")
  const [expectedCTCMax, setExpectedCTCMax] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState("")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  )
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (!hasHydratedRef.current) {
        const storageKey = `swrk:onboarding-step:${session.user.id || session.user.username || "guest"}`
        const savedStep = Number(window.localStorage.getItem(storageKey) || "0")
        const initialStep = Math.max(
          session.user.onboardingStep || 1,
          savedStep || 1,
        )

        setStep(initialStep)
        setName(session.user.name || "")
        setAvatar(session.user.avatar || "")
        setUsername(session.user.username || "")
        setRole(session.user.role || "")
        hasHydratedRef.current = true
      }
    }

    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [session, status, router])

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.user ||
      !hasHydratedRef.current
    ) {
      return
    }

    const storageKey = `swrk:onboarding-step:${session.user.id || session.user.username || "guest"}`
    if (step >= 1 && step <= TOTAL_STEPS) {
      window.localStorage.setItem(storageKey, String(step))
    }
  }, [session?.user, status, step])

  useEffect(() => {
    if (role === "employer" && step > 4 && step < 7) {
      setStep(4)
    }
  }, [role, step])

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
    profilePayload?: Record<string, unknown>,
  ) => {
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, step: targetStep }),
      })
      if (!res.ok) throw new Error("Update failed")

      if (profilePayload && Object.keys(profilePayload).length > 0) {
        const profileRes = await fetch("/api/profile/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profilePayload),
        })
        if (!profileRes.ok) throw new Error("Profile update failed")
      }

      // If targetStep is beyond the UI steps, finalize onboarding
      if (targetStep === TOTAL_STEPS + 1) {
        toast.success("Profile completed successfully! Welcome to Swrk!")
        const storageKey = `swrk:onboarding-step:${session?.user?.id || session?.user?.username || "guest"}`
        window.localStorage.removeItem(storageKey)
        await update({
          ...sessionUpdates,
          onboardingStep: TOTAL_STEPS,
          onboardingCompleted: true,
        })
        router.push("/dashboard")
      } else {
        // Update client session so fields like `username` appear immediately
        try {
          await update({
            ...sessionUpdates,
            onboardingStep: Math.min(targetStep - 1, TOTAL_STEPS),
          })
        } catch {
          // ignore session update failures
        }

        setStep(targetStep)
        toast.success("Saved successfully!")
      }
    } catch {
      toast.error("Failed to save information")
    }
    setLoading(false)
  }

  const onNextStep1 = () => {
    if (!role) {
      toast.error("Please select a role to continue")
      return
    }
    if (!username.trim()) {
      toast.error("Username is required to continue")
      return
    }

    if (usernameAvailable === false) {
      toast.error(usernameError || "Username is already taken")
      return
    }

    return handleStepSubmit(
      2,
      { name, username, avatar, role },
      { name, username, image: avatar, role },
    )
  }
  const onNextStep2 = () => {
    // Professional Profile: only headline and bio in this step
    if (!headline && !bio) {
      toast.error(
        "Please provide a professional headline or a short bio to continue",
      )
      return
    }

    const employeeProfile: Record<string, unknown> = {}
    if (headline) employeeProfile.headline = headline.trim()
    if (bio) employeeProfile.bio = bio.trim()

    const profilePayload: Record<string, unknown> = { employeeProfile }

    return handleStepSubmit(3, {}, {}, profilePayload)
  }

  const onNextStep3 = () => {
    // Education step
    const entries = education.filter((e) => e.school || e.degree)
    if (entries.length === 0) {
      toast.error("Please add at least one education entry or skip to continue")
      return
    }

    const normalizedEducation = [] as Array<Record<string, unknown>>
    for (const e of entries) {
      const inst = e.school?.trim()
      if (!inst) {
        toast.error("Each education entry requires an institution name")
        return
      }
      const startYear = e.year ? parseYear(e.year) : null
      const endYear = e.endYear ? parseYear(e.endYear) : null
      if (e.year && !isValidYear(e.year)) {
        toast.error("Please provide a valid start year for education entries")
        return
      }
      if (
        e.endYear &&
        !isValidYear(e.endYear) &&
        e.endYear.toLowerCase() !== "present"
      ) {
        toast.error("Please provide a valid end year for education entries")
        return
      }
      if (startYear && endYear && startYear > endYear) {
        toast.error("Education start year cannot be after end year")
        return
      }

      normalizedEducation.push({
        institution: inst,
        degree: e.degree?.trim() || undefined,
        field: e.field?.trim() || undefined,
        startYear: startYear ?? undefined,
        endYear: endYear ?? undefined,
      })
    }

    const profilePayload: Record<string, unknown> = {
      employeeProfile: { education: normalizedEducation },
    }
    return handleStepSubmit(4, {}, {}, profilePayload)
  }

  const onNextStep4 = () => {
    // Work experience step - optional
    const entries = workHistory.filter((w) => w.company || w.position)

    const normalizedWorkHistory: Array<Record<string, unknown>> = []
    for (const w of entries) {
      if (!w.company?.trim() || !w.position?.trim()) {
        continue
      }
      const startYear = w.duration ? parseYear(w.duration) : null
      const endYear =
        w.endYear && w.endYear.toLowerCase() !== "present"
          ? parseYear(w.endYear)
          : null
      if (w.duration && !isValidYear(w.duration)) {
        toast.error("Please provide a valid start year for work entries")
        return
      }
      if (
        w.endYear &&
        w.endYear.toLowerCase() !== "present" &&
        !isValidYear(w.endYear)
      ) {
        toast.error("Please provide a valid end year for work entries")
        return
      }
      if (startYear && endYear && startYear > endYear) {
        toast.error("Work start year cannot be after end year")
        return
      }

      normalizedWorkHistory.push({
        company: w.company.trim(),
        role: w.position.trim(),
        startDate: startYear
          ? new Date(startYear, 0, 1).toISOString()
          : undefined,
        endDate:
          !w.isCurrent && endYear
            ? new Date(endYear, 11, 31).toISOString()
            : undefined,
        isCurrent: Boolean(w.isCurrent),
        description: w.description?.trim() || undefined,
      })
    }

    const profilePayload: Record<string, unknown> = {}
    if (normalizedWorkHistory.length > 0) {
      profilePayload.employeeProfile = { workHistory: normalizedWorkHistory }
    }

    if (role === "employer") {
      return handleStepSubmit(7, {}, {}, profilePayload)
    }

    return handleStepSubmit(5, {}, {}, profilePayload)
  }

  const onNextStep5 = () => {
    // Projects step - required for employees/both
    const projectEntries = projects.filter(
      (p) => p.title || p.description || p.url,
    )
    if (projectEntries.length === 0) {
      toast.error("Please add at least one project to continue")
      return
    }

    const normalizedProjects: Array<Record<string, unknown>> = []
    for (const p of projectEntries) {
      const title = p.title?.trim()
      if (!title) {
        toast.error("Each project requires a title")
        return
      }
      if (p.url && !isValidUrl(p.url)) {
        toast.error("Please provide a valid project URL")
        return
      }

      normalizedProjects.push({
        title,
        description: p.description?.trim() || undefined,
        url: p.url?.trim() || undefined,
      })
    }

    const profilePayload: Record<string, unknown> = {
      employeeProfile: { projects: normalizedProjects },
    }
    return handleStepSubmit(6, {}, {}, profilePayload)
  }

  const addPreferredLocation = () => {
    const value = preferredLocationInput.trim()
    if (!value) return

    setPreferredLocations((previous) =>
      previous.includes(value) ? previous : [...previous, value],
    )
    setPreferredLocationInput("")
  }

  const removePreferredLocation = (location: string) => {
    setPreferredLocations((previous) =>
      previous.filter((item) => item !== location),
    )
  }

  const onNextStep6 = () => {
    const profilePayload: Record<string, unknown> = {}
    const filters: Record<string, unknown> = {}
    if (desiredRoles.length > 0) filters.desiredRoles = desiredRoles
    if (desiredIndustries.length > 0)
      filters.desiredIndustries = desiredIndustries
    if (preferredLocations.length > 0)
      filters.preferredLocations = preferredLocations

    if (expectedCTCMin && !isPositiveNumberString(expectedCTCMin)) {
      toast.error("Please enter a valid minimum expected CTC")
      return
    }
    if (expectedCTCMax && !isPositiveNumberString(expectedCTCMax)) {
      toast.error("Please enter a valid maximum expected CTC")
      return
    }

    if (expectedCTCMin || expectedCTCMax) {
      filters.expectedCTC = {}
      if (expectedCTCMin)
        (filters.expectedCTC as Record<string, unknown>).min =
          parseInt(expectedCTCMin)
      if (expectedCTCMax)
        (filters.expectedCTC as Record<string, unknown>).max =
          parseInt(expectedCTCMax)
      if (
        filters.expectedCTC &&
        (filters.expectedCTC as Record<string, number>).min !== undefined &&
        (filters.expectedCTC as Record<string, number>).max !== undefined &&
        (filters.expectedCTC as Record<string, number>).min >
          (filters.expectedCTC as Record<string, number>).max
      ) {
        toast.error("Minimum expected CTC cannot be greater than maximum")
        return
      }
    }

    if (Object.keys(filters).length > 0) {
      profilePayload.employeeProfile = filters
    }
    return handleStepSubmit(7, {}, {}, profilePayload)
  }

  const onNextStep7 = () => {
    if (!role) {
      toast.error("Please select a role to continue")
      return
    }
    if (
      (role === "employee" || role === "both") &&
      projects.filter((p) => p.title).length === 0
    ) {
      toast.error("Please add at least one project to apply for jobs")
      return
    }
    if (phone && !isValidPhone(phone)) {
      toast.error("Please provide a valid phone number (include country code)")
      return
    }
    if (dateOfBirth && !isValidDateISO(dateOfBirth)) {
      toast.error("Please provide a valid date of birth")
      return
    }

    return handleStepSubmit(
      TOTAL_STEPS + 1,
      { role, phone, dateOfBirth, gender },
      { role, onboardingCompleted: true },
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:flex overflow-hidden bg-black min-h-screen">
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
              <div className="text-3xl font-bold">
                {step}/{TOTAL_STEPS}
              </div>
              <div className="text-sm font-medium text-white/60 tracking-wider uppercase">
                Steps
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                3<span className="text-xl">m</span>
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
              {step === 1 && "Choose Your Role"}
              {step === 2 && "Professional Profile"}
              {step === 3 && "Education"}
              {step === 4 && "Work Experience"}
              {step === 5 && "Projects"}
              {step === 6 && "Your Preferences"}
              {step === 7 && "Final Details"}
            </h2>
            <p className="text-muted-foreground">
              {step === 1 &&
                "Select how you'll use Swrk, then share the basics."}
              {step === 2 && "Tell us about your professional background."}
              {step === 3 &&
                "Add your education history so teams know your background."}
              {step === 4 &&
                "Add your work experience (optional if you're a fresher)."}
              {step === 5 &&
                "Showcase your projects to stand out to employers."}
              {step === 6 && "Help us find the best matches for you."}
              {step === 7 && "Add your contact details to complete setup."}
            </p>
          </div>

          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Step {step} of {TOTAL_STEPS}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  How will you be using Swrk?
                </Label>
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
                        id={`role-${r.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`role-${r.id}`}
                        className="flex cursor-pointer flex-col rounded-xl border-2 border-muted bg-transparent p-4 transition-all hover:bg-muted/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <span className="text-base font-bold">{r.label}</span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {r.desc}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-28 w-28 border-4 shadow-xl">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-3xl">
                      {getAvatarFallback(name)}
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
                  loading ||
                  !role ||
                  !name ||
                  !username ||
                  usernameAvailable === false
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Professional Headline</Label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer | React Specialist"
                    className="h-12 bg-muted/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your expertise, and what you're looking for..."
                    className="h-24 w-full rounded-lg bg-muted/50 border-none px-4 py-3 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

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
                  disabled={loading || !headline}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Education</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEducation([
                        ...education,
                        {
                          school: "",
                          degree: "",
                          field: "",
                          year: "",
                          endYear: "",
                        },
                      ])
                    }
                  >
                    + Add
                  </Button>
                </div>
                {education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEducation((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={edu.school}
                      onChange={(e) => {
                        const updated = [...education]
                        updated[idx].school = e.target.value
                        setEducation(updated)
                      }}
                      placeholder="School/University"
                      className="h-10 bg-muted/50 border-none text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...education]
                          updated[idx].degree = e.target.value
                          setEducation(updated)
                        }}
                        placeholder="Degree"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                      <Input
                        value={edu.year}
                        onChange={(e) => {
                          const updated = [...education]
                          updated[idx].year = e.target.value
                          setEducation(updated)
                        }}
                        placeholder="Start year"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                      <Input
                        value={(edu as any).endYear}
                        onChange={(e) => {
                          const updated = [...education]
                          ;(updated[idx] as any).endYear = e.target.value
                          setEducation(updated)
                        }}
                        placeholder="End year"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                    </div>
                  </div>
                ))}
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
                    "Continue"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Work Experience
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setWorkHistory([
                        ...workHistory,
                        {
                          company: "",
                          position: "",
                          duration: "",
                          endYear: "",
                          isCurrent: false,
                          description: "",
                        },
                      ])
                    }
                  >
                    + Add
                  </Button>
                </div>
                {workHistory.map((work, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setWorkHistory((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={work.company}
                        onChange={(e) => {
                          const updated = [...workHistory]
                          updated[idx].company = e.target.value
                          setWorkHistory(updated)
                        }}
                        placeholder="Company"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                      <Input
                        value={work.position}
                        onChange={(e) => {
                          const updated = [...workHistory]
                          updated[idx].position = e.target.value
                          setWorkHistory(updated)
                        }}
                        placeholder="Position"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={work.duration}
                        onChange={(e) => {
                          const updated = [...workHistory]
                          updated[idx].duration = e.target.value
                          setWorkHistory(updated)
                        }}
                        placeholder="Start year (e.g. 2020)"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`current-work-${idx}`}
                        type="checkbox"
                        checked={Boolean((work as any).isCurrent)}
                        onChange={(e) => {
                          const updated = [...workHistory]
                          ;(updated[idx] as any).isCurrent = e.target.checked
                          if (e.target.checked) {
                            ;(updated[idx] as any).endYear = ""
                          }
                          setWorkHistory(updated)
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor={`current-work-${idx}`}
                        className="text-sm"
                      >
                        I currently work here
                      </Label>
                    </div>
                    {!Boolean((work as any).isCurrent) && (
                      <Input
                        value={(work as any).endYear}
                        onChange={(e) => {
                          const updated = [...workHistory]
                          ;(updated[idx] as any).endYear = e.target.value
                          setWorkHistory(updated)
                        }}
                        placeholder="End year (e.g. 2023)"
                        className="h-10 bg-muted/50 border-none text-sm"
                      />
                    )}
                    <textarea
                      value={work.description}
                      onChange={(e) => {
                        const updated = [...workHistory]
                        updated[idx].description = e.target.value
                        setWorkHistory(updated)
                      }}
                      placeholder="What did you accomplish?"
                      className="h-16 w-full rounded-lg bg-muted/50 border-none px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep4}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Projects</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProjects([
                        ...projects,
                        { title: "", description: "", url: "" },
                      ])
                    }
                  >
                    + Add
                  </Button>
                </div>
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setProjects((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={proj.title}
                      onChange={(e) => {
                        const updated = [...projects]
                        updated[idx].title = e.target.value
                        setProjects(updated)
                      }}
                      placeholder="Project title"
                      className="h-10 bg-muted/50 border-none text-sm"
                    />
                    <textarea
                      value={proj.description}
                      onChange={(e) => {
                        const updated = [...projects]
                        updated[idx].description = e.target.value
                        setProjects(updated)
                      }}
                      placeholder="What does this project do?"
                      className="h-20 w-full rounded-lg bg-muted/50 border-none px-3 py-2 font-sans text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Input
                      value={proj.url}
                      onChange={(e) => {
                        const updated = [...projects]
                        updated[idx].url = e.target.value
                        setProjects(updated)
                      }}
                      placeholder="https://github.com/your-project"
                      className="h-10 bg-muted/50 border-none text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep5}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Desired Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Frontend",
                      "Backend",
                      "Fullstack",
                      "DevOps",
                      "Data Science",
                      "Product",
                    ].map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          setDesiredRoles(
                            desiredRoles.includes(r)
                              ? desiredRoles.filter((x) => x !== r)
                              : [...desiredRoles, r],
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          desiredRoles.includes(r)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Desired Industries</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "SaaS",
                      "FinTech",
                      "HealthTech",
                      "AI/ML",
                      "E-commerce",
                      "Web3",
                    ].map((ind) => (
                      <button
                        key={ind}
                        onClick={() =>
                          setDesiredIndustries(
                            desiredIndustries.includes(ind)
                              ? desiredIndustries.filter((x) => x !== ind)
                              : [...desiredIndustries, ind],
                          )
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          desiredIndustries.includes(ind)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Locations</Label>
                  <div className="flex gap-2">
                    <Input
                      value={preferredLocationInput}
                      onChange={(e) =>
                        setPreferredLocationInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addPreferredLocation()
                        }
                      }}
                      placeholder="Add a preferred location"
                      className="h-12 bg-muted/50 border-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPreferredLocation}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {preferredLocations.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {preferredLocations.map((location) => (
                        <Badge
                          key={location}
                          variant="secondary"
                          className="pr-1"
                        >
                          {location}
                          <button
                            type="button"
                            onClick={() => removePreferredLocation(location)}
                            className="ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Expected Salary Range (Annual)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={expectedCTCMin}
                      onChange={(e) => setExpectedCTCMin(e.target.value)}
                      placeholder="Min"
                      type="number"
                      className="h-12 bg-muted/50 border-none"
                    />
                    <Input
                      value={expectedCTCMax}
                      onChange={(e) => setExpectedCTCMax(e.target.value)}
                      placeholder="Max"
                      type="number"
                      className="h-12 bg-muted/50 border-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(5)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep6}
                  className="h-12 flex-1 text-base font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {step === 7 && (
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
                  onClick={() => setStep(role === "employer" ? 4 : 6)}
                  className="h-12 w-12 p-0 shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={onNextStep7}
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
