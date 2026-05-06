import { Groq } from "groq-sdk"
import User from "@/models/user"
import EmployeeProfile from "@/models/employee"
import EmployerProfile from "@/models/employer"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface CandidateProfile {
  _id: string
  name: string
  role: string
  avatar?: string
  linkedinUrl?: string
  isVerified: boolean
  profileVerified?: boolean
  headline?: string
  bio?: string
  skills?: string[]
  currentCity?: string
  currentState?: string
  currentCountry?: string
  preferredLocations?: string[]
  workPreference?: string
  expectedCTC?: {
    min?: number
    max?: number
    currency?: string
    period?: string
    isNegotiable?: boolean
  }
  employmentType?: string[]
  currentStatus?: string
  desiredRoles?: string[]
  desiredIndustries?: string[]
  companyName?: string
  companySize?: string
  companyType?: string
  companyTagline?: string
  companyDescription?: string
  headquarters?: string
  workStyle?: string
  industry?: string[]
  activeOpenings?: Array<{
    title?: string
    location?: string
    locationType?: string
    employmentType?: string
    ctcMin?: number
    ctcMax?: number
    currency?: string
    ctcPeriod?: string
    isActive?: boolean
    requiredSkills?: string[]
    preferredSkills?: string[]
  }>
  filters?: {
    locations?: string[]
    employmentTypes?: string[]
    workPreference?: string[]
    ctcBudgetMin?: number
    ctcBudgetMax?: number
  }
  profileVisibility?: string
}

export function getCandidateScore(candidate: CandidateProfile) {
  let score = 0

  if (candidate.isVerified || candidate.profileVerified) score += 3
  if (candidate.profileVisibility === "public") score += 1
  if (candidate.headline) score += 1
  if (candidate.bio) score += 1
  if (candidate.skills?.length) score += Math.min(candidate.skills.length, 4)
  if (candidate.desiredRoles?.length) score += 1
  if (candidate.desiredIndustries?.length) score += 1
  if (candidate.companyName) score += 1

  return score
}

async function fetchCandidateProfiles(
  userId: string,
  userRole: string,
  excludeIds: string[],
  limit: number = 20,
): Promise<CandidateProfile[]> {
  const oppositeRole = userRole === "employer" ? "employee" : "employer"

  const candidates = await User.find({
    _id: { $nin: [userId, ...excludeIds] },
    role: { $in: [oppositeRole, "both"] },
    isActive: true,
    isBanned: false,
  })
    .select("_id name role avatar linkedinUrl isVerified profileVerified")
    .limit(limit * 2)
    .lean()

  const enriched = await Promise.all(
    candidates.map(async (user) => {
      let profile: any = {}

      if (userRole === "employer") {
        const emp = await EmployeeProfile.findOne({ user: user._id })
          .select(
            "headline bio primarySkills currentCity currentState currentCountry preferredLocations workPreference expectedCTC employmentType currentStatus desiredRoles desiredIndustries",
          )
          .lean()
        profile = emp || {}
      } else {
        const empl = await EmployerProfile.findOne({ user: user._id })
          .select(
            "companyName companySize companyType companyTagline companyDescription headquarters workStyle industry activeOpenings filters",
          )
          .lean()
        profile = empl || {}
      }

      return {
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        linkedinUrl: user.linkedinUrl,
        isVerified: user.isVerified,
        profileVerified: user.profileVerified,
        ...profile,
        _id: String(user._id),
      }
    }),
  )

  return enriched
}

export async function getHeuristicCandidates(
  userId: string,
  userRole: string,
  excludeIds: string[] = [],
  limit: number = 20,
): Promise<CandidateProfile[]> {
  const candidates = await fetchCandidateProfiles(
    userId,
    userRole,
    excludeIds,
    limit,
  )

  return candidates
    .slice()
    .sort((a, b) => getCandidateScore(b) - getCandidateScore(a))
    .slice(0, limit)
}

export async function getAIRankedCandidates(
  userId: string,
  excludeIds: string[] = [],
  limit: number = 20,
): Promise<CandidateProfile[]> {
  const user = await User.findById(userId).lean()

  if (!user) throw new Error("User not found")

  const viewerRole = user.activeRole || user.role || "employee"

  let candidateList = await fetchCandidateProfiles(
    userId,
    viewerRole,
    excludeIds,
    limit * 2,
  )

  if (candidateList.length === 0) return []

  const userProfile =
    viewerRole === "employer"
      ? await EmployerProfile.findOne({ user: userId }).lean()
      : await EmployeeProfile.findOne({ user: userId }).lean()

  const candidatesJson = JSON.stringify(
    candidateList.map((c) => ({
      id: c._id,
      name: c.name,
      headline: c.headline,
      skills: c.skills,
      location: c.currentCity,
      desiredRoles: c.desiredRoles,
      verified: c.isVerified || c.profileVerified,
    })),
  )

  const userJson = JSON.stringify({
    role: user.role,
    name: user.name,
    ...(userProfile || {}),
  })

  const prompt = `You are an AI matching engine for a professional hiring/career platform. Rank the provided candidate profiles by likelihood of being a good match for the user, considering alignment on skills, roles, location, verification status, and professional fit.

User profile: ${userJson}

Available candidates: ${candidatesJson}

Respond with ONLY a JSON array of candidate IDs sorted by match score (best first), in this format:
["id1", "id2", "id3", ...]

No extra text or explanation.`

  const message = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const responseText = message.choices[0]?.message?.content || ""

  let rankedIds: string[] = []
  try {
    rankedIds = JSON.parse(responseText)
  } catch {
    rankedIds = candidateList.map((c) => c._id)
  }

  const ranked = rankedIds
    .map((id) => candidateList.find((c) => c._id === id))
    .filter((c) => c !== undefined) as CandidateProfile[]

  return ranked.slice(0, limit)
}
