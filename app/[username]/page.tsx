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
  BookOpen,
  MessageCircle,
  ExternalLink,
  Loader2,
  FileText,
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
  privacy: {
    showPhone: boolean
    showLinkedin: boolean
    showEmail: boolean
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

export default function ProfilePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<
    EmployeeProfile | EmployerProfile | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${username}`)
        if (!response.ok) throw new Error("Profile not found")

        const data = await response.json()
        setUser(data.user)
        setProfile(data.profile)

        if (session?.user && session.user.username === username) {
          setIsOwnProfile(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (username) fetchProfile()
  }, [username, session])

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

  const empProfile = profile as EmployeeProfile

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
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

        <Card className="overflow-hidden">
          {user.banner ? (
            <img
              src={user.banner}
              alt={`${user.name} banner`}
              className="h-32 w-full object-cover"
            />
          ) : (
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
          )}

          <CardContent className="pt-0 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 -mt-16 relative z-10">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full border-4 border-background shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex-1 pt-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-lg text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  {user.isVerified && (
                    <Badge className="bg-green-500">Verified</Badge>
                  )}
                </div>

                {empProfile?.headline && (
                  <p className="text-lg text-foreground mb-3 font-semibold">
                    {empProfile.headline}
                  </p>
                )}

                {empProfile?.tagline && (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    &quot;{empProfile.tagline}&quot;
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{user.role}</Badge>
                  {user.role === "both" && user.activeRole && (
                    <Badge variant="outline" className="capitalize">
                      Active:{" "}
                      {user.activeRole === "employee"
                        ? "Job Applier"
                        : "Job Poster"}
                    </Badge>
                  )}
                  {user.gender && (
                    <Badge variant="outline" className="capitalize">
                      {user.gender.replace("-", " ")}
                    </Badge>
                  )}
                  {empProfile?.currentStatus && (
                    <Badge className="capitalize">
                      {empProfile.currentStatus.replace("-", " ")}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {empProfile?.currentCity && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {empProfile.currentCity}
                    </div>
                  )}
                  {user.phone && user.privacy?.showPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                  )}
                  {user.privacy?.showEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {empProfile?.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {empProfile.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {empProfile?.primarySkills && empProfile.primarySkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {empProfile.primarySkills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
              {empProfile.secondarySkills &&
                empProfile.secondarySkills.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {empProfile.workHistory.map((exp, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-primary pl-4 pb-4"
                  >
                    <h3 className="text-lg font-semibold">{exp.role}</h3>
                    <p className="text-muted-foreground">{exp.company}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(exp.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {exp.isCurrent
                        ? "Present"
                        : new Date(exp.endDate!).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {empProfile?.education && empProfile.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {empProfile.education.map((edu, idx) => (
                  <div key={idx} className="pb-4 border-b last:border-b-0">
                    <h3 className="text-lg font-semibold">{edu.degree}</h3>
                    <p className="text-muted-foreground">{edu.institution}</p>
                    {edu.field && (
                      <p className="text-sm text-muted-foreground">
                        {edu.field}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {empProfile?.certifications && empProfile.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {empProfile.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Award className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="font-semibold">{cert.name}</p>
                      {cert.issuedBy && (
                        <p className="text-sm text-muted-foreground">
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

        {user.resumes && user.resumes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{resume.title}</p>
                        {resume.isFeatured && (
                          <Badge variant="secondary">Visible on profile</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resume.fileName}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
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

        <Card>
          <CardHeader>
            <CardTitle>Connect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(user.linkedinUrl ||
                empProfile?.socialLinks?.some(
                  (l) => l.platform === "linkedin",
                )) && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={
                      user.linkedinUrl ||
                      empProfile?.socialLinks?.find(
                        (l) => l.platform === "linkedin",
                      )?.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Share2 className="w-4 h-4" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              {(user.githubUrl ||
                empProfile?.socialLinks?.some(
                  (l) => l.platform === "github",
                )) && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={
                      user.githubUrl ||
                      empProfile?.socialLinks?.find(
                        (l) => l.platform === "github",
                      )?.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Code2 className="w-4 h-4" />
                    GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              {(user.portfolioUrl ||
                empProfile?.socialLinks?.some(
                  (l) => l.platform === "website",
                )) && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={
                      user.portfolioUrl ||
                      empProfile?.socialLinks?.find(
                        (l) => l.platform === "website",
                      )?.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="w-4 h-4" />
                    Portfolio
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              {user.professionalLinks?.map((link) => (
                <Button
                  key={`${link.label}-${link.url}`}
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
