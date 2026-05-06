import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { default: User } = await import(
  path.join(__dirname, "../models/user.ts")
)
const { default: EmployeeProfile } = await import(
  path.join(__dirname, "../models/employee.ts")
)
const { default: EmployerProfile } = await import(
  path.join(__dirname, "../models/employer.ts")
)

const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Django",
  "Go",
  "Java",
  "Kotlin",
  "Swift",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "SQL",
  "NoSQL",
  "Product Management",
  "Design",
  "Marketing",
  "Sales",
]

const INDUSTRIES = [
  "SaaS",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "EdTech",
  "Gaming",
  "AI/ML",
  "IoT",
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample(arr, n = 1) {
  const copy = [...arr]
  const out = []
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI not found in .env.local")

  if (mongoose.connection.readyState >= 1) return
  await mongoose.connect(uri)
}

async function createUserIfMissing({ email, username, name, role, avatar }) {
  let existing = await User.findOne({ email })
  if (existing) return existing

  const u = await User.create({
    email,
    name,
    username,
    role,
    activeRole: role === "both" ? "employee" : role,
    isVerified: Math.random() < 0.15,
    profileVerified: Math.random() < 0.1,
    isPremium: Math.random() < 0.05,
    linkedinUrl: `https://www.linkedin.com/in/${username}`,
    githubUrl: `https://github.com/${username}`,
    avatar: avatar || `https://i.pravatar.cc/150?u=${username}`,
    banner: `https://picsum.photos/1200/400?random=${randInt(1, 1000)}`,
    phone: `+91-9${randInt(100000000, 999999999)}`,
    dateOfBirth: new Date(1990 + randInt(0, 10), 0, 1),
    gender: ["male", "female", "non-binary"][randInt(0, 2)],
    professionalLinks: [
      { label: "Portfolio", url: `https://${username}.example.com` },
      { label: "Blog", url: `https://blog.${username}.example.com` },
    ],
    isActive: true,
    isBanned: false,
    isPremium: Math.random() < 0.08,
    premiumPlan: Math.random() < 0.08 ? sample(["basic", "pro"])[0] : "free",
    notifications: undefined,
    privacy: {
      showLinkedin: Math.random() < 0.25,
      showPhone: Math.random() < 0.2,
      showEmail: Math.random() < 0.6,
      showResumes: Math.random() < 0.8,
      profileVisibility: sample(["public", "verified-only", "hidden"])[0],
    },
  })

  return u
}

async function createEmployeeProfileIfMissing(user, idx) {
  let existing = await EmployeeProfile.findOne({ user: user._id })
  if (existing) return existing

  const primary = sample(SKILLS, randInt(3, 6))
  const eduCount = randInt(1, 2)
  const education = []
  for (let i = 0; i < eduCount; i++) {
    education.push({
      institution: `University ${randInt(1, 200)}`,
      degree: sample(["B.Tech", "M.Tech", "B.Sc", "M.Sc", "MBA"])[0],
      field: sample(["Computer Science", "Design", "Business", "Economics"])[0],
      startYear: 2005 + randInt(0, 10),
      endYear: 2010 + randInt(0, 10),
      grade: `${60 + randInt(0, 40)}%`,
    })
  }

  const workCount = randInt(1, 4)
  const workHistory = []
  for (let i = 0; i < workCount; i++) {
    const startYear = 2010 + i * randInt(1, 3)
    const endYear =
      i === 0 && Math.random() < 0.3 ? null : startYear + randInt(1, 4)
    workHistory.push({
      company: `Company ${randInt(1, 500)}`,
      role: sample([
        "Engineer",
        "Senior Engineer",
        "Lead",
        "Manager",
        "CTO",
      ])[0],
      location: sample(["Bengaluru", "Mumbai", "Remote", "Delhi"])[0],
      locationType: sample(["remote", "onsite", "hybrid"])[0],
      startDate: new Date(startYear, 0, 1),
      endDate: endYear ? new Date(endYear, 11, 31) : null,
      isCurrent: endYear === null,
      description: `Worked on ${sample(SKILLS, 2).join(", ")}, delivered product improvements and scaled services.`,
      skills: sample(SKILLS, randInt(3, 6)),
    })
  }

  const projects = []
  for (let i = 0; i < randInt(1, 3); i++) {
    projects.push({
      title: `Project ${randInt(1, 999)}`,
      description: `A project about ${sample(SKILLS)[0]} that solved an important problem.`,
      url: `https://${user.username || user._id}-project-${i}.example.com`,
      techStack: sample(SKILLS, randInt(2, 5)),
      year: 2018 + randInt(0, 6),
    })
  }

  const profile = await EmployeeProfile.create({
    user: user._id,
    headline: `${primary[0]} developer open to opportunities`,
    bio: `Experienced ${primary[0]} developer with strong background in ${sample(INDUSTRIES)[0]}.`,
    tagline: `Passionate about building reliable systems.`,
    currentStatus: sample([
      "actively-looking",
      "open-to-offers",
      "not-looking",
    ])[0],
    desiredRoles: sample(
      ["Frontend", "Backend", "Fullstack", "Product"],
      randInt(1, 2),
    ),
    desiredIndustries: sample(INDUSTRIES, randInt(1, 2)),
    currentCity: sample(["Bengaluru", "Mumbai", "Remote", "Delhi"])[0],
    preferredLocations: sample(
      ["Remote", "Bengaluru", "Mumbai", "Delhi"],
      randInt(1, 2),
    ),
    willingToRelocate: Math.random() < 0.3,
    workPreference: sample(["remote", "onsite", "hybrid", "any"])[0],
    currentCTC: {
      amount: randInt(300000, 2000000),
      currency: "INR",
      period: "annual",
    },
    expectedCTC: {
      min: randInt(400000, 800000),
      max: randInt(800001, 2000000),
      currency: "INR",
      period: "annual",
      isNegotiable: Math.random() < 0.5,
    },
    totalExperienceYears: randInt(0, 15),
    experienceLevel: (
      sample(["fresher", "junior", "mid", "senior", "lead"])[0] || ""
    ).toLowerCase(),
    workHistory,
    primarySkills: primary,
    secondarySkills: sample(SKILLS, randInt(3, 6)),
    languages: [{ name: "English", proficiency: "fluent" }],
    education,
    highestQualification: education[0] ? "bachelors" : "other",
    certifications: [
      {
        name: "Certification X",
        issuedBy: "CertOrg",
        issuedAt: new Date(2019, 1, 1),
      },
    ],
    projects,
    socialLinks: [{ platform: "github", url: user.githubUrl }],
    cvUrl: `https://storage.example.com/cv/${user.username || user._id}.pdf`,
    cvUploadedAt: new Date(),
    preferredBenefits: sample(
      ["health-insurance", "esop", "wfh", "paid-leaves"],
      randInt(1, 3),
    ),
    isBoosted: Math.random() < 0.05,
    profileCompletionScore: randInt(50, 100),
    isVisible: true,
    stats: {
      totalViews: randInt(0, 1000),
      totalRightSwipes: randInt(0, 500),
      totalMatches: randInt(0, 200),
    },
  })

  return profile
}

async function createEmployerProfileIfMissing(user, idx) {
  let existing = await EmployerProfile.findOne({ user: user._id })
  if (existing) return existing

  const industry = sample(INDUSTRIES, 1)[0]
  const openings = []
  for (let i = 0; i < randInt(1, 4); i++) {
    openings.push({
      title: `${sample(["Senior", "Lead", "Junior"])[0]} ${sample(["Frontend Engineer", "Backend Engineer", "DevOps Engineer"])[0]}`,
      description: `We are looking for ${sample(["experienced", "motivated", "talented"])[0]} engineers to join our ${industry} team.`,
      department: sample(["Engineering", "Product", "Design"])[0],
      location: sample(["Bengaluru", "Mumbai", "Remote", "Delhi"])[0],
      locationType: sample(["remote", "onsite", "hybrid"])[0],
      employmentType: sample(["full-time", "contract", "internship"])[0],
      ctcMin: randInt(300000, 800000),
      ctcMax: randInt(800001, 3000000),
      requiredSkills: sample(SKILLS, randInt(2, 5)),
      experienceMin: randInt(0, 3),
      experienceMax: randInt(3, 10),
      perks: sample(
        ["health-insurance", "esop", "wfh", "paid-leaves", "learning-budget"],
        randInt(1, 3),
      ),
      isActive: true,
      openedAt: new Date(),
    })
  }

  const profile = await EmployerProfile.create({
    user: user._id,
    recruiterName: `Recruiter ${idx}`,
    recruiterTitle: sample(["Head of Talent", "CTO", "Founder"])[0],
    companyName: `Acme ${industry} ${idx}`,
    companyLogo: `https://logo.clearbit.com/acme${idx}.com`,
    companyWebsite: `https://acme${idx}.com`,
    companyLinkedin: `https://www.linkedin.com/company/acme${idx}`,
    companyDescription: `We build great ${industry} products to help customers worldwide.`,
    companyTagline: `${industry} focused team building awesome products`,
    industry: [industry],
    companyType: sample(["startup", "mid-size", "enterprise"])[0],
    companySize: sample(["1-10", "11-50", "51-200", "201-500"])[0],
    foundedYear: 2000 + randInt(0, 20),
    headquarters: sample(["Bengaluru", "Mumbai", "Delhi", "Remote"])[0],
    operatingIn: sample(["India", "US", "UK"], randInt(1, 2)),
    fundingStage: sample(["seed", "series-a", "series-b", "na"])[0],
    totalFunding: `${randInt(1, 50)}M`,
    culture: sample(
      ["fast-paced", "collaborative", "data-driven"],
      randInt(1, 2),
    ),
    perks: sample(
      ["health-insurance", "esop", "wfh", "paid-leaves", "learning-budget"],
      randInt(1, 4),
    ),
    workStyle: sample(["remote-first", "hybrid", "onsite-only", "flexible"])[0],
    glassdoorRating: Number((Math.random() * 2 + 3).toFixed(1)),
    activeOpenings: openings,
    filters: {
      roles: sample(["Frontend", "Backend", "Fullstack"], randInt(1, 2)),
      skills: sample(SKILLS, randInt(2, 5)),
      experienceLevels: sample(["junior", "mid", "senior"], randInt(1, 2)),
      experienceMin: 0,
      experienceMax: 10,
      locations: sample(["Remote", "Bengaluru", "Mumbai"], randInt(1, 2)),
      workPreference: sample(["remote", "hybrid", "onsite"], randInt(1, 2)),
    },
    isVerifiedCompany: Math.random() < 0.05,
    profileCompletionScore: randInt(40, 100),
    isVisible: true,
    stats: {
      totalProfilesViewed: randInt(0, 10000),
      totalRightSwipes: randInt(0, 2000),
    },
  })

  return profile
}

async function run() {
  try {
    await connectDB()
    console.log("✅ Connected to DB")

    const counts = { employees: 30, employers: 20, both: 10 }

    console.log("Seeding employees with rich profiles...")
    for (let i = 1; i <= counts.employees; i++) {
      const username = `rich_emp_${i}`
      const u = await createUserIfMissing({
        email: `rich.employee${i}@seed.local`,
        username,
        name: `Rich Employee ${i}`,
        role: "employee",
      })
      await createEmployeeProfileIfMissing(u, i)
    }

    console.log("Seeding employers with rich profiles...")
    for (let i = 1; i <= counts.employers; i++) {
      const username = `rich_er_${i}`
      const u = await createUserIfMissing({
        email: `rich.employer${i}@seed.local`,
        username,
        name: `Rich Employer ${i}`,
        role: "employer",
      })
      await createEmployerProfileIfMissing(u, i)
    }

    console.log("Seeding both-role users with rich profiles...")
    for (let i = 1; i <= counts.both; i++) {
      const username = `rich_both_${i}`
      const u = await createUserIfMissing({
        email: `rich.both${i}@seed.local`,
        username,
        name: `Rich Both ${i}`,
        role: "both",
      })
      await createEmployeeProfileIfMissing(u, i)
      await createEmployerProfileIfMissing(u, i)
    }

    console.log("🎉 Rich seeding complete")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await mongoose.disconnect()
    console.log("🔌 Disconnected")
    process.exit(0)
  }
}

run()
