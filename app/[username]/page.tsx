"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase,
  BookOpen,
  Award,
  FileText,
  Crown,
  MessageCircle,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Rocket,
} from "lucide-react"

interface UserProfile {
  _id: string
  name: string
  username: string
  avatar: string
  banner: string
  email: string
  phone: string
  role: "employer" | "employee" | "both"
  activeRole?: "employer" | "employee"
  dateOfBirth: string
  gender: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  professionalLinks?: Array<{ label: string; url: string }>
  resumes?: Array<{
    _id: string
    title: string
    url: string
    fileName: string
    isFeatured: boolean
  }>
  isVerified: boolean
  profileVerified?: boolean
  privacy: {
    showPhone: boolean
    showLinkedin: boolean
    showEmail: boolean
    showResumes?: boolean
    profileVisibility: string
  }
}

interface EmployeeProfile {
  headline: string
  bio: string
  tagline: string
  currentStatus: string
  desiredRoles: string[]
  currentCity: string
  currentState: string
  currentCountry: string
  preferredLocations: string[]
  workPreference: string
  primarySkills: string[]
  secondarySkills: string[]
  experienceLevel: string
  totalExperienceYears: number
  education: Array<{
    institution: string
    degree: string
    field: string
    startYear?: string
    endYear?: string
  }>
  workHistory: Array<{
    company: string
    role: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
  }>
  projects?: Array<{
    title: string
    description?: string
    url?: string
  }>
  certifications: Array<{
    name: string
    issuedBy: string
  }>
  socialLinks: Array<{
    platform: string
    url: string
  }>
}

interface EmployerProfile {
  recruiterName: string
  recruiterTitle: string
  recruiterBio: string
  companyName: string
  companyLogo: string
  companyWebsite: string
  companyLinkedin: string
  companyDescription: string
  companyTagline: string
  industry: string[]
  companyType?: string
  companySize: string
  foundedYear?: number
  headquarters?: string
  operatingIn?: string[]
  fundingStage?: string
  totalFunding?: string
  culture?: string[]
  perks?: string[]
  workStyle?: string
  glassdoorRating?: number
  activeOpenings?: Array<{
    title: string
    location?: string
    locationType?: string
    employmentType?: string
    description?: string
    requiredSkills?: string[]
    preferredSkills?: string[]
    isActive?: boolean
  }>
  stats?: {
    totalProfilesViewed: number
    totalRightSwipes: number
    totalMatches: number
    totalHires: number
  }
}

interface CredibilityStats {
  feedbackCount: number
  overallScore: number
  responsivenessScore: number
  communicationScore: number
  professionalismScore: number
  punctualityScore: number
  recommendationRate: number
  completedInterviews: number
  hiredCount: number
}

interface SubscriptionData {
  _id: string
  status: string
  plan?: {
    name: string
    displayName: string
  }
}

const formatMonthYear = (value?: string | null) => {
  if (!value) return "Unknown"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Unknown"
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<
    EmployeeProfile | EmployerProfile | null
  >(null)
  const [employeeProfile, setEmployeeProfile] =
    useState<EmployeeProfile | null>(null)
  const [employerProfileData, setEmployerProfileData] =
    useState<EmployerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [error, setError] = useState("")
  const [isProfileVisible, setIsProfileVisible] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  )
  const [credibilityStats, setCredibilityStats] =
    useState<CredibilityStats | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${username}`)
        if (!response.ok) throw new Error("Profile not found")

        const data = await response.json()
        setUser({ ...(data.user || {}), resumes: data.resumes || [] })
        setEmployeeProfile(data.employeeProfile || null)
        setEmployerProfileData(data.employerProfile || null)
        setProfile(data.profile || data.employeeProfile || data.employerProfile)
        setCredibilityStats(data.credibilityStats || null)

        const visibility = data.user?.privacy?.profileVisibility || "public"
        const ownsProfile = session?.user?.username === username
        const viewerIsVerified = Boolean(
          session?.user?.isVerified || session?.user?.isAdmin,
        )

        if (visibility === "hidden") {
          setIsProfileVisible(Boolean(ownsProfile || session?.user?.isAdmin))
        } else if (visibility === "verified-only") {
          setIsProfileVisible(Boolean(ownsProfile || viewerIsVerified))
        } else {
          setIsProfileVisible(true)
        }

        setIsOwnProfile(Boolean(ownsProfile))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      void fetchProfile()
    }
  }, [username, session])

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isOwnProfile) return
      try {
        const res = await fetch("/api/subscriptions/manage")
        if (res.ok) {
          const data = await res.json()
          if (data.subscription) setSubscription(data.subscription)
        }
      } catch (err) {
        console.error("Failed to fetch subscription", err)
      }
    }

    void fetchSubscription()
  }, [isOwnProfile])

  const empProfile = employeeProfile ?? (profile as EmployeeProfile | null)
  const employerProfile =
    employerProfileData ?? (profile as EmployerProfile | null)
  const isEmployerProfile =
    user?.role === "employer" ||
    (user?.role === "both" && user.activeRole === "employer")
  const isPremium =
    subscription && ["active", "created"].includes(subscription.status)

  const completionPercentage = useMemo(() => {
    if (!user) return 0

    let completed = 0
    let total = isEmployerProfile ? 15 : 10

    if (user.name) completed++
    if (user.avatar) completed++
    if (user.phone) completed++
    if (user.dateOfBirth) completed++
    if (user.gender) completed++

    if (isEmployerProfile) {
      if (employerProfile?.companyName) completed++
      if (employerProfile?.companyDescription || employerProfile?.recruiterBio)
        completed++
      if (employerProfile?.industry?.length) completed++
      if (employerProfile?.companyWebsite) completed++
      if (employerProfile?.activeOpenings?.length) completed++
      if (empProfile?.headline) completed++
      if (empProfile?.bio) completed++
      if (empProfile?.education?.length) completed++
      if (empProfile?.workHistory?.length) completed++
      if (empProfile?.primarySkills?.length) completed++
    } else {
      if (empProfile?.headline) completed++
      if (empProfile?.bio) completed++
      if (empProfile?.education?.length) completed++
      if (empProfile?.workHistory?.length) completed++
      if (empProfile?.primarySkills?.length) completed++
    }

    return Math.round((completed / total) * 100)
  }, [empProfile, employerProfile, isEmployerProfile, user])

  const canShowResumes = Boolean(
    isOwnProfile || user?.privacy?.showResumes !== false,
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  if (!isProfileVisible && !isOwnProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Profile Not Visible</h1>
          <p className="text-muted-foreground">
            This profile is set to private and is not visible to you.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const companyLocation = [
    employerProfile?.headquarters,
    employerProfile?.operatingIn?.join(", "),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end gap-3">
          {isOwnProfile && (
            <>
              <Button
                onClick={() => router.push("/settings/profile")}
                variant="outline"
              >
                Edit Profile
              </Button>
              <Button
                onClick={() => router.push("/dashboard/messages")}
                variant="outline"
                size="icon"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => router.push("/settings/profile")}
                variant="ghost"
                size="sm"
                className="flex items-center gap-3 px-3 py-1"
              >
                <span className="text-sm font-semibold">
                  {completionPercentage}%
                </span>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </Button>
            </>
          )}
        </div>

        <Card className="overflow-hidden pt-0">
          {user.banner ? (
            <div className="relative">
              <img
                src={user.banner}
                alt={`${user.name} banner`}
                className="h-40 w-full object-cover sm:h-48"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
            </div>
          ) : (
            <div className="h-40 bg-primary bg-gradient-to-t from-card via-card/30 to-transparent sm:h-48" />
          )}

          <CardContent className="pb-8 pt-0 sm:pb-10">
            <div className="relative z-10 -mt-24 flex flex-col gap-4 px-4 sm:flex-row sm:gap-8 sm:px-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`h-36 w-36 flex-shrink-0 rounded-full object-cover shadow-xl sm:h-40 sm:w-40 ${
                    isPremium
                      ? "border-4 border-amber-400"
                      : "border-4 border-secondary"
                  }`}
                />
              ) : (
                <div
                  className={`flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-full shadow-xl sm:h-40 sm:w-40 ${
                    isPremium
                      ? "border-4 border-amber-400 bg-gradient-to-br from-amber-500/20 to-amber-500/5"
                      : "border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5"
                  }`}
                >
                  <span className="text-5xl font-bold text-muted-foreground">
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex-1 pt-2 sm:pt-8">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {user.name}
                    </h1>
                    <p className="text-base font-medium text-muted-foreground sm:text-lg">
                      @{user.username}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {isPremium && (
                      <Badge className="flex items-center gap-1 bg-amber-500 text-white">
                        <Crown className="h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                    {(user.isVerified || user.profileVerified) && (
                      <Badge className="bg-green-500 text-white">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {isEmployerProfile ? (
                  <>
                    <p className="mb-3 text-lg font-semibold text-foreground sm:text-xl">
                      {employerProfile?.companyName || user.name}
                    </p>
                    {empProfile?.headline && (
                      <p className="mb-3 text-lg font-semibold text-foreground sm:text-xl">
                        {empProfile.headline}
                      </p>
                    )}
                    {empProfile?.tagline ? (
                      <p className="mb-4 max-w-2xl text-sm italic text-muted-foreground sm:text-base">
                        &quot;{empProfile.tagline}&quot;
                      </p>
                    ) : employerProfile?.companyTagline ? (
                      <p className="mb-4 max-w-2xl text-sm italic text-muted-foreground sm:text-base">
                        {employerProfile.companyTagline}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    {empProfile?.headline && (
                      <p className="mb-3 text-lg font-semibold text-foreground sm:text-xl">
                        {empProfile.headline}
                      </p>
                    )}
                    {empProfile?.tagline && (
                      <p className="mb-4 max-w-2xl text-sm italic text-muted-foreground sm:text-base">
                        &quot;{empProfile.tagline}&quot;
                      </p>
                    )}
                  </>
                )}

                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {isEmployerProfile ? "Hiring" : "Open to work"}
                  </Badge>
                  {user.role === "both" && user.activeRole && (
                    <Badge variant="outline" className="capitalize">
                      {user.activeRole === "employee"
                        ? "Open to work"
                        : "Hiring"}
                    </Badge>
                  )}
                  {user.gender && (
                    <Badge variant="outline" className="capitalize">
                      {user.gender.replace("-", " ")}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground sm:text-base">
                  {isEmployerProfile ? (
                    companyLocation ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{companyLocation}</span>
                      </div>
                    ) : null
                  ) : (
                    (empProfile?.currentCity ||
                      empProfile?.currentState ||
                      empProfile?.currentCountry) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {[
                            empProfile?.currentCity,
                            empProfile?.currentState,
                            empProfile?.currentCountry,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )
                  )}

                  {user.phone && user.privacy?.showPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {user.privacy?.showEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {isEmployerProfile ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5" />
                      Recruiter Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {empProfile?.headline && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          Professional Headline
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {empProfile.headline}
                        </p>
                      </div>
                    )}
                    {empProfile?.bio && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          Bio
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                          {empProfile.bio}
                        </p>
                      </div>
                    )}
                    {empProfile?.primarySkills?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {empProfile.primarySkills.map((skill) => (
                            <Badge key={skill} variant="default">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {empProfile?.education?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Education
                        </p>
                        <div className="space-y-3">
                          {empProfile.education.map((edu, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border p-3"
                            >
                              <h3 className="text-sm font-semibold">
                                {edu.degree}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {edu.institution}
                              </p>
                              {edu.field && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {edu.field}
                                </p>
                              )}
                              {(edu.startYear || edu.endYear) && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {edu.startYear || "Start"}
                                  {edu.endYear ? ` - ${edu.endYear}` : ""}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {empProfile?.workHistory?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Work Experience
                        </p>
                        <div className="space-y-4">
                          {empProfile.workHistory.map((exp, idx) => (
                            <div
                              key={idx}
                              className="relative border-l-2 border-primary pb-4 pl-5 last:pb-0"
                            >
                              <div className="absolute left-0 top-0 h-3.5 w-3.5 -translate-x-[8px] rounded-full bg-primary" />
                              <h3 className="text-sm font-semibold">
                                {exp.role}
                              </h3>
                              <p className="text-xs font-medium text-muted-foreground">
                                {exp.company}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatMonthYear(exp.startDate)} -{" "}
                                {exp.isCurrent
                                  ? "Present"
                                  : formatMonthYear(exp.endDate)}
                              </p>
                              {exp.description && (
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Briefcase className="h-5 w-5" />
                      Company Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {employerProfile?.recruiterBio && (
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                        {employerProfile.recruiterBio}
                      </p>
                    )}
                    {employerProfile?.companyDescription && (
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                        {employerProfile.companyDescription}
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {employerProfile?.companyWebsite && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Website
                          </p>
                          <a
                            href={employerProfile.companyWebsite}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline"
                          >
                            {employerProfile.companyWebsite}
                          </a>
                        </div>
                      )}
                      {employerProfile?.companyLinkedin && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            LinkedIn
                          </p>
                          <a
                            href={employerProfile.companyLinkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline"
                          >
                            {employerProfile.companyLinkedin}
                          </a>
                        </div>
                      )}
                      {employerProfile?.companyType && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Company Type
                          </p>
                          <p className="text-sm font-medium capitalize">
                            {employerProfile.companyType.replace(/-/g, " ")}
                          </p>
                        </div>
                      )}
                      {employerProfile?.companySize && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Company Size
                          </p>
                          <p className="text-sm font-medium">
                            {employerProfile.companySize}
                          </p>
                        </div>
                      )}
                      {employerProfile?.foundedYear && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Founded
                          </p>
                          <p className="text-sm font-medium">
                            {employerProfile.foundedYear}
                          </p>
                        </div>
                      )}
                      {employerProfile?.fundingStage && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Funding Stage
                          </p>
                          <p className="text-sm font-medium capitalize">
                            {employerProfile.fundingStage.replace(/-/g, " ")}
                          </p>
                        </div>
                      )}
                      {employerProfile?.totalFunding && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Total Funding
                          </p>
                          <p className="text-sm font-medium">
                            {employerProfile.totalFunding}
                          </p>
                        </div>
                      )}
                      {employerProfile?.glassdoorRating && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                            Glassdoor Rating
                          </p>
                          <p className="text-sm font-medium">
                            {employerProfile.glassdoorRating}/5
                          </p>
                        </div>
                      )}
                    </div>
                    {employerProfile?.culture?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Culture
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {employerProfile.culture.map((item) => (
                            <Badge key={item} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {employerProfile?.perks?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Perks
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {employerProfile.perks.map((item) => (
                            <Badge key={item} variant="secondary">
                              {item.replace(/-/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Briefcase className="h-5 w-5" />
                      Active Openings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employerProfile?.activeOpenings?.length ? (
                      <div className="space-y-4">
                        {employerProfile.activeOpenings
                          .filter((opening) => opening.isActive !== false)
                          .map((opening, idx) => (
                            <div
                              key={`${opening.title}-${idx}`}
                              className="rounded-lg border border-border p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {opening.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {[opening.location, opening.locationType]
                                      .filter(Boolean)
                                      .join(" · ") || "Flexible location"}
                                  </p>
                                </div>
                                {opening.employmentType && (
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {opening.employmentType.replace(/-/g, " ")}
                                  </Badge>
                                )}
                              </div>
                              {opening.description && (
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                                  {opening.description}
                                </p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {opening.requiredSkills?.map((skill) => (
                                  <Badge key={skill} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active openings posted yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {empProfile?.bio && (
                  <Card className="">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                        {empProfile.bio}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {empProfile?.primarySkills?.length ? (
                  <Card className="">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Briefcase className="h-5 w-5" />
                        Skills & Expertise
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                          Primary Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {empProfile.primarySkills.map((skill) => (
                            <Badge key={skill} variant="default">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {empProfile.secondarySkills?.length ? (
                        <div className="border-t pt-2">
                          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                            Other Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {empProfile.secondarySkills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                {empProfile?.workHistory?.length ? (
                  <Card className="">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Briefcase className="h-5 w-5" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {empProfile.workHistory.map((exp, idx) => (
                          <div
                            key={idx}
                            className="relative border-l-2 border-primary pb-6 pl-6 last:pb-0"
                          >
                            <div className="absolute left-0 top-0 h-4 w-4 -translate-x-[9px] rounded-full bg-primary" />
                            <h3 className="text-lg font-semibold">
                              {exp.role}
                            </h3>
                            <p className="font-medium text-muted-foreground">
                              {exp.company}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatMonthYear(exp.startDate)} -{" "}
                              {exp.isCurrent
                                ? "Present"
                                : formatMonthYear(exp.endDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-8 lg:col-span-1">
            <Card className="">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5" />
                  Interview Credibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {credibilityStats?.feedbackCount ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Overall score
                        </p>
                        <p className="text-2xl font-bold">
                          {credibilityStats.overallScore}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Responsiveness
                        </p>
                        <p className="text-2xl font-bold">
                          {credibilityStats.responsivenessScore}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Professionalism
                        </p>
                        <p className="text-2xl font-bold">
                          {credibilityStats.professionalismScore}/5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Feedbacks
                        </p>
                        <p className="text-2xl font-bold">
                          {credibilityStats.feedbackCount}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        Recommendation: {credibilityStats.recommendationRate}%
                      </Badge>
                      <Badge variant="outline">
                        Interviews: {credibilityStats.completedInterviews}
                      </Badge>
                      <Badge variant="outline">
                        Hires: {credibilityStats.hiredCount}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No interview feedback yet. Credibility stats will appear
                    after interviews are reviewed.
                  </p>
                )}
              </CardContent>
            </Card>

            {!isEmployerProfile && empProfile?.education?.length ? (
              <Card className="">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {empProfile.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                      >
                        <h3 className="text-sm font-semibold">{edu.degree}</h3>
                        <p className="text-xs text-muted-foreground">
                          {edu.institution}
                        </p>
                        {edu.field && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {edu.field}
                          </p>
                        )}
                        {(edu.startYear || edu.endYear) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {edu.startYear || "Start"}
                            {edu.endYear ? ` - ${edu.endYear}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!isEmployerProfile && empProfile?.projects?.length ? (
              <Card className="">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Rocket className="h-5 w-5" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {empProfile.projects.map((project, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-tight">
                            {project.title}
                          </h3>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                        {project.description && (
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-primary hover:underline"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!isEmployerProfile && empProfile?.certifications?.length ? (
              <Card className="">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {empProfile.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{cert.name}</p>
                          {cert.issuedBy && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {cert.issuedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {(!isEmployerProfile || isOwnProfile) &&
            canShowResumes &&
            user.resumes?.length ? (
              <Card className="">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.resumes.map((resume) => (
                      <div
                        key={resume._id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/50"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {resume.title}
                            </p>
                            {resume.isFeatured && (
                              <Badge
                                variant="secondary"
                                className="flex-shrink-0 text-xs"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {resume.fileName}
                          </p>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <a href={resume.url} target="_blank" rel="noreferrer">
                            Open Resume
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {isEmployerProfile && (
              <Card className="">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5" />
                    Company Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Profiles viewed
                    </span>
                    <span className="font-medium">
                      {employerProfile?.stats?.totalProfilesViewed ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Right swipes</span>
                    <span className="font-medium">
                      {employerProfile?.stats?.totalRightSwipes ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Matches</span>
                    <span className="font-medium">
                      {employerProfile?.stats?.totalMatches ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hires</span>
                    <span className="font-medium">
                      {employerProfile?.stats?.totalHires ?? 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.linkedinUrl &&
              user.privacy?.showLinkedin &&
              user.githubUrl &&
              user.portfolioUrl && (
                <Card className="">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Connect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {session ? (
                      <div className="flex items-center gap-4">
                        {user.linkedinUrl && user.privacy?.showLinkedin && (
                          <a
                            href={user.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/logos/linkedin.svg"
                              alt="LinkedIn"
                              className="h-5 w-5 hover:-translate-y-2 transition-transform md:h-10 md:w-10"
                            />
                          </a>
                        )}
                        {user.githubUrl && (
                          <a
                            href={user.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/logos/github.svg"
                              alt="GitHub"
                              className="h-4 w-4 hover:-translate-y-2 transition-transform md:h-8 md:w-8"
                            />
                          </a>
                        )}
                        {user.portfolioUrl && (
                          <a
                            href={user.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/logos/portfolio.svg"
                              alt="Portfolio"
                              className="h-4 w-4 hover:-translate-y-2 transition-transform md:h-8 md:w-8"
                            />
                          </a>
                        )}
                        {user.professionalLinks?.map((link) => {
                          const isNotStandardLink = ![
                            user.linkedinUrl,
                            user.githubUrl,
                            user.portfolioUrl,
                          ].includes(link.url)
                          return (
                            isNotStandardLink && (
                              <Button
                                key={`${link.label}-${link.url}`}
                                asChild
                                variant="outline"
                                size="sm"
                                className="justify-start gap-2"
                              >
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Globe className="h-4 w-4" />
                                  <span className="truncate">{link.label}</span>
                                  <ExternalLink className="ml-auto h-3 w-3 flex-shrink-0" />
                                </a>
                              </Button>
                            )
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="mb-3 text-sm text-muted-foreground">
                          Sign in to view social links
                        </p>
                        <Button
                          onClick={() => router.push("/signin")}
                          variant="outline"
                          size="sm"
                        >
                          Sign In
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
