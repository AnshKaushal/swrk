"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Code2,
  Share2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  FileText,
  Crown,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Loader2,
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
  featuredResumeId?: string | null
  resumes?: Array<{
    _id: string
    title: string
    url: string
    fileName: string
    isVisibleOnProfile: boolean
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
  }>
  certifications: Array<{
    name: string
    issuedBy: string
  }>
  socialLinks: Array<{
    platform: string
    url: string
  }>
  stats?: {
    totalViews: number
    totalMatches: number
  }
}

interface EmployerProfile {
  recruiterName: string
  recruiterTitle: string
  companyName: string
  companyLogo: string
  companyWebsite: string
  companyLinkedin: string
  companyDescription: string
  companyTagline: string
  industry: string[]
  companySize: string
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
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [error, setError] = useState("")
  const [isProfileVisible, setIsProfileVisible] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  )

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${username}`)
        if (!response.ok) throw new Error("Profile not found")

        const data = await response.json()
        setUser(data.user)
        setProfile(data.profile)

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

        if (ownsProfile) {
          setIsOwnProfile(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    const fetchSubscription = async () => {
      if (isOwnProfile) {
        try {
          const res = await fetch("/api/subscriptions/manage")
          if (res.ok) {
            const data = await res.json()
            if (data.subscription) {
              setSubscription(data.subscription)
            }
          }
        } catch (err) {
          console.error("Failed to fetch subscription", err)
        }
      }
    }

    if (username) {
      fetchProfile()
      fetchSubscription()
    }
  }, [username, session, isOwnProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
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

  const canShowResumes = user.privacy?.showResumes !== false
  const empProfile = profile as EmployeeProfile
  const isPremium =
    subscription && ["active", "created"].includes(subscription.status)

  const calculateCompletionPercentage = () => {
    let completed = 0
    let total = 10

    if (user.name) completed++
    if (user.avatar) completed++
    if (empProfile?.headline) completed++
    if (empProfile?.bio) completed++
    if (empProfile?.education && empProfile.education.length > 0) completed++
    if (empProfile?.workHistory && empProfile.workHistory.length > 0)
      completed++
    if (user.phone) completed++
    if (user.dateOfBirth) completed++
    if (user.gender) completed++
    if (empProfile?.primarySkills && empProfile.primarySkills.length > 0)
      completed++

    return Math.round((completed / total) * 100)
  }

  const completionPercentage = calculateCompletionPercentage()
  const isProfileIncomplete = completionPercentage < 100

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {isOwnProfile && isProfileIncomplete && (
          <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-amber-900">
                  Complete Your Profile
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-800">Profile Completion</span>
                    <span className="font-semibold text-amber-900">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-amber-800">
                  Add more details to make your profile stand out to hiring
                  teams.
                </p>
              </div>
              <Button
                onClick={() => router.push(`/settings/profile`)}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Complete Profile
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {isOwnProfile && (
            <>
              <Button
                onClick={() => router.push(`/settings/profile`)}
                variant="outline"
              >
                Edit Profile
              </Button>
              {user.role !== "employer" && session?.user?.email && (
                <Button
                  onClick={() => router.push(`/messages/${username}`)}
                  variant="outline"
                  size="icon"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg pt-0">
              {user.banner ? (
                <div className="relative">
                  <img
                    src={user.banner}
                    alt={`${user.name} banner`}
                    className="h-40 sm:h-48 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                </div>
              ) : (
                <div className="h-40 sm:h-48 bg-secondary" />
              )}

              <CardContent className="pt-0 pb-8 sm:pb-10">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 -mt-20 relative z-10 px-4 sm:px-6">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-xl object-cover flex-shrink-0 ${
                        isPremium
                          ? "border-4 border-amber-400"
                          : "border-4 border-secondary"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 flex items-center justify-center shadow-xl flex-shrink-0 ${
                        isPremium
                          ? "border-amber-400 bg-gradient-to-br from-amber-500/20 to-amber-500/5"
                          : "border-background bg-gradient-to-br from-primary/20 to-primary/5"
                      }`}
                    >
                      <span className="text-5xl font-bold text-muted-foreground">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 pt-2 sm:pt-8">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                          {user.name}
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground font-medium">
                          @{user.username}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {isPremium && (
                          <Badge className="bg-amber-500 text-white flex items-center gap-1">
                            <Crown className="w-3 h-3" />
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

                    {empProfile?.headline && (
                      <p className="text-lg sm:text-xl text-foreground mb-3 font-semibold">
                        {empProfile.headline}
                      </p>
                    )}

                    {empProfile?.tagline && (
                      <p className="text-sm sm:text-base text-muted-foreground italic mb-4 max-w-2xl">
                        &quot;{empProfile.tagline}&quot;
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-5">
                      <Badge variant="secondary" className="capitalize">
                        #{user.role === "employee" ? "Open to work" : "Hiring"}
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
                      {!user.role && empProfile?.currentStatus && (
                        <Badge className="capitalize bg-blue-500">
                          {empProfile.currentStatus}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm sm:text-base text-muted-foreground">
                      {(empProfile?.currentCity ||
                        empProfile?.currentState ||
                        empProfile?.currentCountry) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
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
                      )}
                      {user.phone && user.privacy?.showPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.privacy?.showEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {empProfile?.bio && (
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {empProfile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {empProfile?.primarySkills &&
              empProfile.primarySkills.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
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
                    {empProfile.secondarySkills &&
                      empProfile.secondarySkills.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
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
                      )}
                  </CardContent>
                </Card>
              )}

            {empProfile?.workHistory && empProfile.workHistory.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {empProfile.workHistory.map((exp, idx) => (
                      <div
                        key={idx}
                        className="relative pl-6 pb-6 border-l-2 border-primary last:pb-0"
                      >
                        <div className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full -translate-x-[9px]" />
                        <h3 className="text-lg font-semibold">{exp.role}</h3>
                        <p className="text-muted-foreground font-medium">
                          {exp.company}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
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
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            {empProfile?.education && empProfile.education.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {empProfile.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="pb-4 border-b last:border-b-0 last:pb-0"
                      >
                        <h3 className="font-semibold text-sm">{edu.degree}</h3>
                        <p className="text-xs text-muted-foreground">
                          {edu.institution}
                        </p>
                        {edu.field && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {edu.field}
                          </p>
                        )}
                        {(edu.startYear || edu.endYear) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {edu.startYear || "Start"}
                            {edu.endYear ? ` - ${edu.endYear}` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {empProfile?.certifications &&
              empProfile.certifications.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {empProfile.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Award className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{cert.name}</p>
                            {cert.issuedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {cert.issuedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {canShowResumes && user.resumes && user.resumes.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.resumes.map((resume) => (
                      <div
                        key={resume._id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm truncate">
                              {resume.title}
                            </p>
                            {resume.isFeatured && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex-shrink-0"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
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
            )}

            {user.linkedinUrl &&
              user.privacy?.showLinkedin &&
              user.githubUrl &&
              user.portfolioUrl && (
                <Card className="shadow-md">
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
                              className="w-5 md:w-10 h-5 md:h-10 hover:-translate-y-2 transition-transform"
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
                              className="w-4 md:w-8 h-4 md:h-8 hover:-translate-y-2 transition-transform"
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
                              className="w-4 md:w-8 h-4 md:h-8 hover:-translate-y-2 transition-transform"
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
                                className="gap-2 justify-start"
                              >
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Globe className="w-4 h-4" />
                                  <span className="truncate">{link.label}</span>
                                  <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0" />
                                </a>
                              </Button>
                            )
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
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
