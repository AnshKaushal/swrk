"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X, Rocket } from "lucide-react"
import Cropper from "react-easy-crop"
import { toast } from "sonner"

type EducationItem = {
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  grade: string
}

type WorkHistoryItem = {
  company: string
  role: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

type ProjectItem = {
  title: string
  description: string
  url: string
}

type AddressFields = {
  street?: string
  city?: string
  state?: string
  postalCode?: string
}

type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

type ProfessionalLink = {
  label: string
  url: string
}

type ProfileApiResponse = {
  user?: {
    email?: string
    name?: string
    phone?: string
    gender?: string
    address?: AddressFields
    avatar?: string
    banner?: string
    linkedinUrl?: string
    githubUrl?: string
    portfolioUrl?: string
    professionalLinks?: ProfessionalLink[]
    role?: string
    activeRole?: string
    privacy?: {
      showEmail?: boolean
      showPhone?: boolean
      showResumes?: boolean
    }
  }
  activeRole?: string
  employeeProfile?: {
    headline?: string
    bio?: string
    tagline?: string
    currentStatus?: string
    availableFrom?: string
    currentCity?: string
    currentState?: string
    currentCountry?: string
    workPreference?: string
    primarySkills?: unknown[]
    secondarySkills?: unknown[]
    desiredRoles?: unknown[]
    desiredIndustries?: unknown[]
    desiredCompanyTypes?: unknown[]
    desiredCompanies?: unknown[]
    desiredCompanySize?: { min?: number; max?: number }
    preferredLocations?: unknown[]
    willingToRelocate?: boolean
    currentCTC?: { amount?: number; currency?: string; period?: string }
    expectedCTC?: {
      min?: number
      max?: number
      currency?: string
      period?: string
      isNegotiable?: boolean
    }
    employmentType?: unknown[]
    totalExperienceYears?: number
    experienceLevel?: string
    workHistory?: unknown[]
    education?: unknown[]
    highestQualification?: string
    certifications?: unknown[]
    projects?: unknown[]
    socialLinks?: unknown[]
    companyRatingMin?: number
    avoidCompanies?: unknown[]
    preferredBenefits?: unknown[]
  }
  employerProfile?: Record<string, unknown>
}

const normalizeProfessionalLinks = (
  links?: ProfessionalLink[],
  fallback: ProfessionalLink[] = [],
) => {
  const merged = [...fallback, ...(links || [])].filter((link) => link.url)
  const deduped: ProfessionalLink[] = []

  for (const link of merged) {
    if (
      deduped.length >= 5 ||
      deduped.some(
        (existing) =>
          existing.label.toLowerCase() === link.label.toLowerCase() &&
          existing.url === link.url,
      )
    ) {
      continue
    }
    deduped.push({ label: link.label || "Link", url: link.url })
  }

  return deduped.length > 0 ? deduped.slice(0, 5) : fallback.slice(0, 5)
}

const emptyEducationItem = (): EducationItem => ({
  institution: "",
  degree: "",
  field: "",
  startYear: "",
  endYear: "",
  grade: "",
})

const emptyWorkHistoryItem = (): WorkHistoryItem => ({
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
})

const emptyProjectItem = (): ProjectItem => ({
  title: "",
  description: "",
  url: "",
})

const normalizeEducation = (
  education: unknown[] | undefined,
): EducationItem[] => {
  if (!Array.isArray(education)) return []
  return education.map((item) => {
    const source = item as Record<string, unknown>
    return {
      institution: (source.institution as string) || "",
      degree: (source.degree as string) || "",
      field: (source.field as string) || "",
      startYear: source.startYear
        ? String(source.startYear)
        : source.year
          ? String(source.year)
          : "",
      endYear: source.endYear ? String(source.endYear) : "",
      grade: (source.grade as string) || "",
    }
  })
}

const formatDateInput = (value?: string | Date | null) => {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

const formatDateDisplay = (value?: string | Date | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const parseDisplayDate = (value?: string) => {
  if (!value) return null

  const normalized = value.trim()
  if (!normalized) return null

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const fallback = new Date(normalized)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const normalizeWorkHistory = (
  workHistory: unknown[] | undefined,
): WorkHistoryItem[] => {
  if (!Array.isArray(workHistory)) return []

  return workHistory.map((item) => {
    const source = item as Record<string, unknown>
    return {
      company: (source.company as string) || "",
      role: ((source.role as string) ||
        (source.position as string) ||
        "") as string,
      startDate: formatDateDisplay(
        (source.startDate as string) || (source.duration as string) || null,
      ),
      endDate: source.isCurrent
        ? ""
        : formatDateDisplay((source.endDate as string) || null),
      isCurrent: Boolean(source.isCurrent),
      description: (source.description as string) || "",
    }
  })
}

const normalizeProjects = (projects: unknown[] | undefined): ProjectItem[] => {
  if (!Array.isArray(projects)) return []

  return projects.map((item) => {
    const source = item as Record<string, unknown>
    return {
      title: (source.title as string) || "",
      description: (source.description as string) || "",
      url: (source.url as string) || (source.link as string) || "",
    }
  })
}

const normalizeStringList = (items: unknown[] | undefined) => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (typeof item === "string" ? item : String(item || "")))
    .filter(Boolean)
}

const normalizeAddress = (address: AddressFields | undefined) => ({
  street: address?.street || "",
  city: address?.city || "",
  state: address?.state || "",
  postalCode: (address as Record<string, unknown>)?.zip
    ? String((address as Record<string, unknown>).zip)
    : address?.postalCode || "",
})

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

export default function ProfileSettingsPage() {
  const { status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [primarySkillInput, setPrimarySkillInput] = useState("")
  const [secondarySkillInput, setSecondarySkillInput] = useState("")
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropMode, setCropMode] = useState<"avatar" | "banner" | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{ type: "city" | "state" | "country"; name: string }>
  >([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [preferredLocationInput, setPreferredLocationInput] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    headline: "",
    bio: "",
    avatar: "",
    banner: "",
    address: { street: "", city: "", state: "", postalCode: "" },
    currentCity: "",
    currentState: "",
    currentCountry: "India",
    primarySkills: [] as string[],
    secondarySkills: [] as string[],
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    professionalLinks: [
      { label: "LinkedIn", url: "" },
      { label: "GitHub", url: "" },
      { label: "Portfolio", url: "" },
    ] as ProfessionalLink[],
    education: [] as EducationItem[],
    workHistory: [] as WorkHistoryItem[],
    projects: [] as ProjectItem[],
    preferredLocations: [] as string[],
    role: "employee",
    activeRole: "employee",
    visibility: { showEmail: true, showPhone: false, showResumes: true },
    companyName: "",
    companyWebsite: "",
    companyLinkedin: "",
    companyDescription: "",
    companyTagline: "",
    industry: "" as string,
    companyType: "",
    companySize: "",
    foundedYear: "",
    fundingStage: "",
  })
  const [boostQuota, setBoostQuota] = useState<null | {
    remaining: number
    limit: number
  }>(null)
  const [boostLoading, setBoostLoading] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [boostBannerVisible, setBoostBannerVisible] = useState(false)
  const boostBannerTimer = useRef<number | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile/me")
      if (response.ok) {
        const data = (await response.json()) as ProfileApiResponse
        const userData = data.user ?? {}
        const privacy = userData.privacy ?? {}
        const normalizedRole =
          userData.role === "job-seeker"
            ? "employee"
            : userData.role || "employee"
        const activeRole =
          data.activeRole ||
          userData.activeRole ||
          (normalizedRole === "both" ? "employee" : normalizedRole)
        const professionalLinks = normalizeProfessionalLinks(
          userData.professionalLinks,
          [
            { label: "LinkedIn", url: userData.linkedinUrl || "" },
            { label: "GitHub", url: userData.githubUrl || "" },
            { label: "Portfolio", url: userData.portfolioUrl || "" },
          ],
        )
        setFormData((prev) => ({
          ...prev,
          name: userData.name || prev.name,
          email: userData.email || prev.email,
          phone: userData.phone || prev.phone,
          gender: userData.gender || prev.gender,
          avatar: userData.avatar || "",
          banner: userData.banner || "",
          address: normalizeAddress(userData.address),
          linkedinUrl: userData.linkedinUrl || "",
          githubUrl: userData.githubUrl || "",
          portfolioUrl: userData.portfolioUrl || "",
          professionalLinks,
          role: normalizedRole,
          activeRole: activeRole === "employer" ? "employer" : "employee",
          primarySkills: normalizeStringList(
            data.employeeProfile?.primarySkills,
          ),
          secondarySkills: normalizeStringList(
            data.employeeProfile?.secondarySkills,
          ),
          education: normalizeEducation(data.employeeProfile?.education),
          workHistory: normalizeWorkHistory(data.employeeProfile?.workHistory),
          projects: normalizeProjects(data.employeeProfile?.projects),
          preferredLocations: normalizeStringList(
            data.employeeProfile?.preferredLocations,
          ),
          visibility: {
            showEmail: privacy.showEmail ?? prev.visibility.showEmail,
            showPhone: privacy.showPhone ?? prev.visibility.showPhone,
            showResumes: privacy.showResumes ?? prev.visibility.showResumes,
          },
          headline: data.employeeProfile?.headline || "",
          bio: data.employeeProfile?.bio || "",
          currentCity: data.employeeProfile?.currentCity || "",
          currentState: data.employeeProfile?.currentState || "",
          currentCountry: data.employeeProfile?.currentCountry || "India",
          companyName: (data.employerProfile?.companyName as string) || "",
          companyWebsite:
            (data.employerProfile?.companyWebsite as string) || "",
          companyLinkedin:
            (data.employerProfile?.companyLinkedin as string) || "",
          companyDescription:
            (data.employerProfile?.companyDescription as string) || "",
          companyTagline:
            (data.employerProfile?.companyTagline as string) || "",
          industry: Array.isArray(data.employerProfile?.industry)
            ? (data.employerProfile.industry as string[])[0] || ""
            : "",
          companyType: (data.employerProfile?.companyType as string) || "",
          companySize: (data.employerProfile?.companySize as string) || "",
          foundedYear: (data.employerProfile?.foundedYear as number)
            ? String(data.employerProfile?.foundedYear)
            : "",
          fundingStage: (data.employerProfile?.fundingStage as string) || "",
        }))
        // fetch boost quota after profile data
        try {
          const b = await fetch("/api/boost/use", { cache: "no-store" })
          if (b.ok) {
            const bj = await b.json()
            setBoostQuota(bj.quota ?? null)
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
      return
    }

    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void (async () => {
        await fetchProfile()
      })()
    }
  }, [status, router, fetchProfile])

  useEffect(() => {
    return () => {
      if (boostBannerTimer.current) {
        window.clearTimeout(boostBannerTimer.current)
      }
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  const handleLocationSearch = async (
    query: string,
    type: "city" | "state" | "country",
  ) => {
    if (!query.trim()) {
      setLocationSuggestions([])
      return
    }
    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(query)}&type=${type}`,
      )
      if (response.ok) {
        const data = await response.json()
        setLocationSuggestions(data.results || [])
      }
    } catch (error) {
      console.error("Location search error:", error)
    }
  }

  const handleSelectLocation = (location: {
    type: "city" | "state" | "country"
    name: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      [location.type === "city"
        ? "currentCity"
        : location.type === "state"
          ? "currentState"
          : "currentCountry"]: location.name,
    }))
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const addSkill = (type: "primary" | "secondary") => {
    const input = type === "primary" ? primarySkillInput : secondarySkillInput
    if (input.trim()) {
      setFormData((prev) => ({
        ...prev,
        [type === "primary" ? "primarySkills" : "secondarySkills"]: [
          ...(type === "primary" ? prev.primarySkills : prev.secondarySkills),
          input.trim(),
        ],
      }))
      if (type === "primary") setPrimarySkillInput("")
      else setSecondarySkillInput("")
    }
  }

  const removeSkill = (skill: string, type: "primary" | "secondary") => {
    setFormData((prev) => ({
      ...prev,
      [type === "primary" ? "primarySkills" : "secondarySkills"]: (type ===
      "primary"
        ? prev.primarySkills
        : prev.secondarySkills
      ).filter((s) => s !== skill),
    }))
  }

  const uploadProfileAsset = async (file: File, kind: "avatar" | "banner") => {
    const setUploading =
      kind === "avatar" ? setAvatarUploading : setBannerUploading
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("kind", kind)
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: uploadData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to upload ${kind}`)
      }
      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        [kind]: data.url,
      }))
      // force immediate session refresh with new avatar
      if (update) {
        try {
          await update({ avatar: data.url })
        } catch {
          // non-fatal
        }
      }
      // dispatch event for navbar/sidebar refresh
      try {
        window.dispatchEvent(new Event("mutch:session-updated"))
      } catch {
        // non-fatal
      }
      toast.success(`${kind === "avatar" ? "Profile photo" : "Banner"} updated`)
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : `Failed to upload ${kind}`,
      )
    } finally {
      setUploading(false)
    }
  }

  const profileAssetUploading = avatarUploading || bannerUploading

  const onCropComplete = useCallback(
    (_: CropArea, croppedAreaPixelsLocal: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixelsLocal)
    },
    [],
  )

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotationValue = 0,
    circular = false,
  ) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No 2d context")

    const rotRad = getRadianAngle(rotationValue)
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotationValue,
    )

    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.translate(-image.width / 2, -image.height / 2)
    ctx.drawImage(image, 0, 0)

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
    )

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    ctx.putImageData(data, 0, 0)

    if (circular) {
      const maskedCanvas = document.createElement("canvas")
      const maskedContext = maskedCanvas.getContext("2d")
      if (!maskedContext) throw new Error("No 2d context")
      const size = Math.min(pixelCrop.width, pixelCrop.height)
      maskedCanvas.width = size
      maskedCanvas.height = size
      maskedContext.beginPath()
      maskedContext.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      maskedContext.closePath()
      maskedContext.clip()
      maskedContext.drawImage(
        canvas,
        (size - canvas.width) / 2,
        (size - canvas.height) / 2,
      )
      return new Promise<Blob | null>((resolve) =>
        maskedCanvas.toBlob((blob) => resolve(blob), "image/png"),
      )
    }

    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92),
    )
  }

  const handleFileSelect = async (
    file: File | null,
    kind: "avatar" | "banner",
  ) => {
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImageToCrop(String(reader.result))
      setCropMode(kind)
      setCropModalOpen(true)
      setZoom(1)
      setRotation(0)
      setCrop({ x: 0, y: 0 })
      setPreviewUrl(null)
    })
    reader.readAsDataURL(file)
  }

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels || !cropMode) return
    const circular = cropMode === "avatar"
    const blob = await getCroppedImg(
      imageToCrop,
      croppedAreaPixels,
      rotation,
      circular,
    )
    if (blob) {
      const file = new File([blob], `${cropMode}.png`, { type: blob.type })
      await uploadProfileAsset(file, cropMode)
    }
    setCropModalOpen(false)
    setImageToCrop(null)
    setCropMode(null)
  }

  const handleCropCancel = () => {
    setCropModalOpen(false)
    setImageToCrop(null)
    setCropMode(null)
    setPreviewUrl(null)
  }

  useEffect(() => {
    let isActive = true

    const updatePreview = async () => {
      if (!imageToCrop || !croppedAreaPixels || !cropMode) {
        if (isActive) setPreviewUrl(null)
        return
      }

      try {
        const blob = await getCroppedImg(
          imageToCrop,
          croppedAreaPixels,
          rotation,
          cropMode === "avatar",
        )
        if (!blob || !isActive) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current)
          return url
        })
      } catch (error) {
        console.error("Failed to build crop preview:", error)
      }
    }

    updatePreview()

    return () => {
      isActive = false
    }
  }, [croppedAreaPixels, cropMode, imageToCrop, rotation])

  const updateEducationItem = (
    index: number,
    field: keyof EducationItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const addEducationItem = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, emptyEducationItem()],
    }))
  }

  const removeEducationItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const updateWorkHistoryItem = (
    index: number,
    field: keyof WorkHistoryItem,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((item, i) => {
        if (i !== index) return item

        const updated = { ...item, [field]: value }
        if (field === "isCurrent" && value) {
          updated.endDate = ""
        }

        return updated
      }),
    }))
  }

  const addWorkHistoryItem = () => {
    setFormData((prev) => ({
      ...prev,
      workHistory: [...prev.workHistory, emptyWorkHistoryItem()],
    }))
  }

  const removeWorkHistoryItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((_, i) => i !== index),
    }))
  }

  const updateProjectItem = (
    index: number,
    field: keyof ProjectItem,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const addProjectItem = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, emptyProjectItem()],
    }))
  }

  const removeProjectItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  const addPreferredLocation = () => {
    const value = preferredLocationInput.trim()
    if (!value) return

    setFormData((prev) =>
      prev.preferredLocations.includes(value)
        ? prev
        : {
            ...prev,
            preferredLocations: [...prev.preferredLocations, value],
          },
    )
    setPreferredLocationInput("")
  }

  const removePreferredLocation = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(
        (item) => item !== location,
      ),
    }))
  }

  const addProfessionalLink = () => {
    setFormData((prev) =>
      prev.professionalLinks.length >= 5
        ? prev
        : {
            ...prev,
            professionalLinks: [
              ...prev.professionalLinks,
              { label: "", url: "" },
            ],
          },
    )
  }

  const updateProfessionalLink = (
    index: number,
    field: keyof ProfessionalLink,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      professionalLinks: prev.professionalLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    }))
  }

  const removeProfessionalLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      professionalLinks: prev.professionalLinks.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Coerce education years to numbers and workHistory dates to ISO strings
      const educationPayload = formData.education
        .map((e) => ({
          institution: e.institution,
          degree: e.degree || undefined,
          field: e.field || undefined,
          startYear: e.startYear ? parseInt(String(e.startYear)) : undefined,
          endYear: e.endYear ? parseInt(String(e.endYear)) : undefined,
          grade: e.grade || undefined,
        }))
        .filter((e) => e.institution)

      const workPayload = formData.workHistory
        .map((w) => {
          const startDate = parseDisplayDate(w.startDate)
          const endDate = parseDisplayDate(w.endDate)
          return {
            company: w.company,
            role: w.role,
            startDate: startDate ? startDate.toISOString() : undefined,
            endDate: endDate ? endDate.toISOString() : undefined,
            isCurrent: Boolean(w.isCurrent),
            description: w.description || undefined,
          }
        })
        .filter((w) => w.company && w.role)

      const projectPayload = formData.projects
        .map((project) => ({
          title: project.title.trim(),
          description: project.description.trim() || undefined,
          url: project.url.trim() || undefined,
        }))
        .filter((project) => project.title)

      const includeEmployerProfile = formData.role !== "employee"

      const payload: Record<string, unknown> = {
        user: {
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zip: formData.address.postalCode,
          },
          linkedinUrl:
            formData.professionalLinks[0]?.url || formData.linkedinUrl,
          githubUrl: formData.professionalLinks[1]?.url || formData.githubUrl,
          portfolioUrl:
            formData.professionalLinks[2]?.url || formData.portfolioUrl,
          professionalLinks: formData.professionalLinks.filter(
            (link) => link.label || link.url,
          ),
          visibility: formData.visibility,
          activeRole: formData.activeRole,
        },
        employeeProfile: {
          headline: formData.headline,
          bio: formData.bio,
          primarySkills: formData.primarySkills,
          secondarySkills: formData.secondarySkills,
          education: educationPayload,
          workHistory: workPayload,
          projects: projectPayload,
          currentCity: formData.currentCity,
          currentState: formData.currentState,
          currentCountry: formData.currentCountry,
          preferredLocations: formData.preferredLocations,
        },
      }

      if (includeEmployerProfile) {
        payload.employerProfile = {
          companyName: formData.companyName,
          companyWebsite: formData.companyWebsite,
          companyLinkedin: formData.companyLinkedin,
          companyDescription: formData.companyDescription,
          companyTagline: formData.companyTagline,
          industry: formData.industry ? [formData.industry] : [],
          companyType: formData.companyType,
          companySize: formData.companySize,
          foundedYear: formData.foundedYear
            ? parseInt(formData.foundedYear)
            : undefined,
          fundingStage: formData.fundingStage,
        }
      }

      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        toast.success("Profile updated successfully!")
        try {
          // Let other UI refresh session/profile data
          window.dispatchEvent(new Event("mutch:session-updated"))
          window.dispatchEvent(new Event("mutch:notifications-updated"))
        } catch (e) {}
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update profile")
      }
    } catch {
      toast.error("An error occurred while updating your profile")
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
    <>
      <form onSubmit={handleSubmit} className="divide-y divide-border">
        {boostBannerVisible ? (
          <div className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:mx-6 lg:mx-8">
            Your profile boost is active and will increase visibility for a
            short time.
            {boostQuota ? (
              <span className="ml-2 font-medium">
                {boostQuota.remaining}/{boostQuota.limit} boosts remaining.
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Profile Media</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Upload your profile banner and photo.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <Label>Banner</Label>
              <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                <div className="aspect-[4/1] w-full">
                  {formData.banner ? (
                    <img
                      src={formData.banner}
                      alt="Banner"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No banner uploaded
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bannerUploading}
                onClick={() => bannerInputRef.current?.click()}
              >
                {bannerUploading ? "Uploading..." : "Change banner"}
              </Button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0])
                    handleFileSelect(e.target.files[0], "banner")
                  e.currentTarget.value = ""
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 flex-none rounded-full bg-muted overflow-hidden border border-border">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {formData.name ? formData.name.charAt(0) : "U"}
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploading ? "Uploading..." : "Change photo"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG or WebP. Max 5MB.
                  </p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        handleFileSelect(e.target.files[0], "avatar")
                      e.currentTarget.value = ""
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Personal Information</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Use a permanent address where you can receive mail.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger id="gender">
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

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Open account settings to change your email address.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Street address"
                value={formData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                className="mb-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
              </div>
              <Input
                placeholder="Postal code"
                value={formData.address.postalCode}
                onChange={(e) =>
                  handleAddressChange("postalCode", e.target.value)
                }
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Professional Profile</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Tell hiring teams about your professional background.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                name="headline"
                placeholder="e.g. Full Stack Developer"
                value={formData.headline}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <Input
                    placeholder="City"
                    value={formData.currentCity}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentCity: e.target.value,
                      }))
                      handleLocationSearch(e.target.value, "city")
                      setShowLocationSuggestions(true)
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />
                  {showLocationSuggestions &&
                    locationSuggestions.some((s) => s.type === "city") && (
                      <div className="absolute top-full left-0 right-0 bg-card border rounded-md shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                        {locationSuggestions
                          .filter((s) => s.type === "city")
                          .map((loc, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            >
                              {loc.name}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="State"
                    value={formData.currentState}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentState: e.target.value,
                      }))
                      handleLocationSearch(e.target.value, "state")
                      setShowLocationSuggestions(true)
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />
                  {showLocationSuggestions &&
                    locationSuggestions.some((s) => s.type === "state") && (
                      <div className="absolute top-full left-0 right-0 bg-card border rounded-md shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                        {locationSuggestions
                          .filter((s) => s.type === "state")
                          .map((loc, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            >
                              {loc.name}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Country"
                    value={formData.currentCountry}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentCountry: e.target.value,
                      }))
                      handleLocationSearch(e.target.value, "country")
                      setShowLocationSuggestions(true)
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />
                  {showLocationSuggestions &&
                    locationSuggestions.some((s) => s.type === "country") && (
                      <div className="absolute top-full left-0 right-0 bg-card border rounded-md shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                        {locationSuggestions
                          .filter((s) => s.type === "country")
                          .map((loc, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            >
                              {loc.name}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Active Role</Label>
              {false && formData.role === "both" ? (
                <Select
                  value={formData.activeRole}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, activeRole: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Switch role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Open to work</SelectItem>
                    <SelectItem value="employer">Hiring</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="w-fit capitalize">
                  {formData.activeRole === "employee"
                    ? "Open to work"
                    : "Hiring"}
                </Badge>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Professional Links</Label>
                  <p className="text-xs text-muted-foreground">
                    LinkedIn, GitHub, and Portfolio are pre-filled. Add up to 2
                    more custom links.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProfessionalLink}
                  disabled={formData.professionalLinks.length >= 5}
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-3">
                {formData.professionalLinks.map((link, index) => {
                  const isGithub = link.label.toLowerCase() === "github"
                  const githubUsername = isGithub
                    ? link.url
                        .replace("https://github.com/", "")
                        .replace("/", "")
                    : ""

                  return (
                    <div
                      key={`${link.label}-${index}`}
                      className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]"
                    >
                      <Input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) =>
                          updateProfessionalLink(index, "label", e.target.value)
                        }
                        disabled={
                          link.label.toLowerCase() === "linkedin" ||
                          link.label.toLowerCase() === "github" ||
                          link.label.toLowerCase() === "portfolio"
                        }
                      />
                      {isGithub ? (
                        <Input
                          placeholder="GitHub username (without url)"
                          value={githubUsername}
                          onChange={(e) => {
                            const username = e.target.value.trim()
                            const fullUrl = username
                              ? `https://github.com/${username}`
                              : ""
                            updateProfessionalLink(index, "url", fullUrl)
                          }}
                        />
                      ) : (
                        <Input
                          placeholder="https://"
                          value={link.url}
                          onChange={(e) =>
                            updateProfessionalLink(index, "url", e.target.value)
                          }
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProfessionalLink(index)}
                        disabled={
                          link.label.toLowerCase() === "linkedin" ||
                          link.label.toLowerCase() === "github" ||
                          link.label.toLowerCase() === "portfolio"
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Skills</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Add the skills that best represent your profile.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6 rounded-xl border border-border p-4">
            <div className="space-y-2">
              <Label>Primary Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={primarySkillInput}
                  onChange={(e) => setPrimarySkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill("primary")
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addSkill("primary")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.primarySkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.primarySkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="pr-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill, "primary")}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Secondary Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={secondarySkillInput}
                  onChange={(e) => setSecondarySkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill("secondary")
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addSkill("secondary")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.secondarySkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.secondarySkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="pr-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill, "secondary")}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Education</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Add your educational background.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            {formData.education.map((edu, index) => (
              <div
                key={index}
                className="space-y-4 p-4 border border-border rounded-lg"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      placeholder="University name"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducationItem(
                          index,
                          "institution",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      placeholder="e.g. Bachelor"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducationItem(index, "degree", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Input
                      placeholder="e.g. Computer Science"
                      value={edu.field}
                      onChange={(e) =>
                        updateEducationItem(index, "field", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Input
                      placeholder="e.g. 3.8"
                      value={edu.grade}
                      onChange={(e) =>
                        updateEducationItem(index, "grade", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Year</Label>
                    <Input
                      type="number"
                      placeholder="2018"
                      value={edu.startYear}
                      onChange={(e) =>
                        updateEducationItem(index, "startYear", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Year</Label>
                    <Input
                      type="number"
                      placeholder="2022"
                      value={edu.endYear}
                      onChange={(e) =>
                        updateEducationItem(index, "endYear", e.target.value)
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEducationItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addEducationItem}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Add Education
            </Button>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Work Experience</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Add your recent work history and timelines.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6">
            {formData.workHistory.map((work, index) => (
              <div
                key={index}
                className="space-y-4 p-4 border border-border rounded-lg"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Company name"
                      value={work.company}
                      onChange={(e) =>
                        updateWorkHistoryItem(index, "company", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={work.role}
                      onChange={(e) =>
                        updateWorkHistoryItem(index, "role", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={work.startDate}
                      onChange={(e) =>
                        updateWorkHistoryItem(
                          index,
                          "startDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={work.endDate}
                      disabled={work.isCurrent}
                      onChange={(e) =>
                        updateWorkHistoryItem(index, "endDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id={`current-role-${index}`}
                      type="checkbox"
                      checked={work.isCurrent}
                      onChange={(e) =>
                        updateWorkHistoryItem(
                          index,
                          "isCurrent",
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`current-role-${index}`}>
                      I currently work here
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your responsibilities and achievements"
                    value={work.description}
                    onChange={(e) =>
                      updateWorkHistoryItem(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    rows={4}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeWorkHistoryItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addWorkHistoryItem}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Add Work Experience
            </Button>
          </div>
        </div>

        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="text-base/7 font-semibold">Preferred Locations</h2>
            <p className="mt-1 text-sm/6 text-muted-foreground">
              Press Enter to add each preference as a separate location.
            </p>
          </div>
          <div className="md:col-span-2 space-y-4 rounded-xl border border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a preferred location"
                value={preferredLocationInput}
                onChange={(e) => setPreferredLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addPreferredLocation()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addPreferredLocation}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.preferredLocations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.preferredLocations.map((location) => (
                  <Badge key={location} variant="secondary" className="pr-1">
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
        </div>

        {formData.role !== "employer" ? (
          <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h2 className="text-base/7 font-semibold">Projects</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Add the projects that best represent your work.
              </p>
            </div>
            <div className="md:col-span-2 space-y-6">
              {formData.projects.map((project, index) => (
                <div
                  key={index}
                  className="space-y-4 rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProjectItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={project.title}
                    onChange={(e) =>
                      updateProjectItem(index, "title", e.target.value)
                    }
                    placeholder="Project title"
                  />
                  <Textarea
                    value={project.description}
                    onChange={(e) =>
                      updateProjectItem(index, "description", e.target.value)
                    }
                    placeholder="What does this project do?"
                    rows={4}
                  />
                  <Input
                    value={project.url}
                    onChange={(e) =>
                      updateProjectItem(index, "url", e.target.value)
                    }
                    placeholder="https://github.com/your-project"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addProjectItem}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </div>
          </div>
        ) : null}

        {formData.role !== "employee" ? (
          <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
              <h2 className="text-base/7 font-semibold">Company Profile</h2>
              <p className="mt-1 text-sm/6 text-muted-foreground">
                Add your company information if you're an employer.
              </p>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="e.g. Acme Corporation"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  name="companyWebsite"
                  placeholder="https://company.com"
                  value={formData.companyWebsite}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLinkedin">Company LinkedIn</Label>
                <Input
                  id="companyLinkedin"
                  name="companyLinkedin"
                  placeholder="https://linkedin.com/company/..."
                  value={formData.companyLinkedin}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyTagline">Company Tagline</Label>
                <Input
                  id="companyTagline"
                  name="companyTagline"
                  placeholder="Brief tagline for your company"
                  value={formData.companyTagline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  name="companyDescription"
                  placeholder="Tell candidates about your company"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="e.g. SaaS, FinTech"
                    value={formData.industry}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType">Company Type</Label>
                  <Select
                    value={formData.companyType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, companyType: value }))
                    }
                  >
                    <SelectTrigger id="companyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="mid-size">Mid-size</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="mnc">MNC</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="ngo">NGO</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, companySize: value }))
                    }
                  >
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-2000">
                        501-2000 employees
                      </SelectItem>
                      <SelectItem value="2000+">2000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    name="foundedYear"
                    type="number"
                    placeholder="e.g. 2020"
                    value={formData.foundedYear}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingStage">Funding Stage</Label>
                  <Select
                    value={formData.fundingStage}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, fundingStage: value }))
                    }
                  >
                    <SelectTrigger id="fundingStage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                      <SelectItem value="pre-seed">Pre-seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series-a">Series A</SelectItem>
                      <SelectItem value="series-b">Series B</SelectItem>
                      <SelectItem value="series-c+">Series C+</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={boostLoading}
              onClick={async () => {
                try {
                  setBoostLoading(true)

                  // make sure we have the latest quota
                  let quota = boostQuota
                  if (!quota) {
                    try {
                      const qres = await fetch("/api/boost/use", {
                        method: "GET",
                        cache: "no-store",
                      })
                      if (qres.ok) {
                        const qj = await qres.json()
                        quota = qj.quota ?? null
                        setBoostQuota(quota)
                      }
                    } catch (e) {
                      // ignore
                    }
                  }

                  // If user is on free plan (limit 0) or has no remaining, prompt upgrade
                  if (
                    !quota ||
                    quota.limit === 0 ||
                    (typeof quota.remaining === "number" &&
                      quota.remaining <= 0)
                  ) {
                    setUpgradeOpen(true)
                    return
                  }

                  const res = await fetch("/api/boost/use", { method: "POST" })
                  const json = await res.json()
                  if (!res.ok) {
                    if (res.status === 429) {
                      setUpgradeOpen(true)
                      toast.error(json?.error || "Boost limit reached")
                      return
                    }
                    toast.error(json?.error || "Failed to boost profile")
                    return
                  }

                  setBoostQuota(json.quota ?? null)
                  setBoostBannerVisible(true)
                  if (boostBannerTimer.current) {
                    window.clearTimeout(boostBannerTimer.current)
                  }
                  boostBannerTimer.current = window.setTimeout(() => {
                    setBoostBannerVisible(false)
                  }, 4500)
                  toast.success("Profile boosted")
                } catch (e) {
                  console.error(e)
                  toast.error("Boost failed")
                } finally {
                  setBoostLoading(false)
                }
              }}
            >
              {boostLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Boost
            </Button>

            {boostQuota ? (
              <div className="text-sm text-muted-foreground">
                Boosts: {boostQuota.remaining}/{boostQuota.limit} remaining
              </div>
            ) : null}
          </div>
        </div>
      </form>
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="w-full max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Upgrade to unlock Boosts</DialogTitle>
            <DialogDescription>
              Boosts are available on paid plans. Upgrade your subscription to
              get more boosts and increased visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUpgradeOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setUpgradeOpen(false)
                router.push("/subscription")
              }}
            >
              Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cropModalOpen && Boolean(imageToCrop)}
        onOpenChange={(open) => {
          if (!open) {
            handleCropCancel()
          }
        }}
      >
        <DialogContent
          className="w-full max-w-4xl! p-4 sm:p-6"
          showCloseButton={false}
        >
          <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <DialogTitle>
                {cropMode === "avatar" ? "Crop profile photo" : "Crop banner"}
              </DialogTitle>
              <DialogDescription>
                Adjust zoom and rotation before saving.
              </DialogDescription>
            </div>
            <Button variant="ghost" onClick={handleCropCancel}>
              Cancel
            </Button>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <div className="relative h-[360px] overflow-hidden rounded-xl bg-black/80">
                <Cropper
                  image={imageToCrop || undefined}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={cropMode === "avatar" ? 1 / 1 : 4 / 1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Zoom</span>
                    <span className="text-muted-foreground">
                      {zoom.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Rotation</span>
                    <span className="text-muted-foreground">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Live preview</p>
                <div
                  className={`overflow-hidden border border-border bg-muted/30 ${
                    cropMode === "avatar"
                      ? "mx-auto h-36 w-36 rounded-full"
                      : "aspect-[4/1] rounded-xl"
                  }`}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Cropped preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Preview loading
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleCropSave}
                className="w-full"
                disabled={profileAssetUploading}
              >
                {profileAssetUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {profileAssetUploading ? "Uploading..." : "Save crop"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
