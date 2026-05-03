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

const { default: Employee } = await import(
  path.join(__dirname, "../models/employee.ts")
)

const { default: Employer } = await import(
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

async function createUser(email, username, name, role) {
  // prevent duplicates
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
    avatar: `https://i.pravatar.cc/150?u=${username}`,
  })

  return u
}

async function createEmployee(userId, idx) {
  let existing = await Employee.findOne({ user: userId })
  if (existing) return existing

  const primary = sample(SKILLS, randInt(3, 6))

  return Employee.create({
    user: userId,
    headline: `${primary[0]} engineer open to opportunities`,
    bio: `Experienced ${primary[0]} engineer with ${randInt(1, 12)} years in ${sample(INDUSTRIES)[0]}.`,
    desiredRoles: sample(
      ["frontend", "backend", "fullstack", "pm", "design"],
      2,
    ),
    desiredIndustries: sample(INDUSTRIES, 2),
    currentCity: ["Bengaluru", "Mumbai", "Delhi", "Remote"][idx % 4],
    totalExperienceYears: randInt(0, 15),
    experienceLevel: ["fresher", "junior", "mid", "senior", "lead"][
      Math.floor(Math.random() * 5)
    ],
    primarySkills: primary,
    secondarySkills: sample(SKILLS, randInt(2, 6)),
    isVisible: true,
    profileCompletionScore: randInt(40, 100),
  })
}

async function createEmployer(userId, idx) {
  let existing = await Employer.findOne({ user: userId })
  if (existing) return existing

  const industry = sample(INDUSTRIES, 1)[0]

  return Employer.create({
    user: userId,
    recruiterName: `Recruiter ${idx}`,
    companyName: `Acme ${industry} ${idx}`,
    companyLogo: `https://logo.clearbit.com/acme${idx}.com`,
    companyWebsite: `https://acme${idx}.com`,
    companyTagline: `${industry} focused team building awesome products`,
    industry: [industry],
    companyType: sample(["startup", "mid-size", "enterprise"])[0],
    companySize: sample(["1-10", "11-50", "51-200", "201-500"])[0],
    isVerifiedCompany: Math.random() < 0.05,
    isVisible: true,
    profileCompletionScore: randInt(30, 95),
    filters: {
      roles: sample(["frontend", "backend", "fullstack", "devops", "qa"], 2),
      skills: sample(SKILLS, 3),
      experienceLevels: sample(["junior", "mid", "senior"], 2),
    },
  })
}

async function run() {
  try {
    await connectDB()
    console.log("✅ Connected to DB")

    const totalEach = 50

    console.log("Seeding employees...")
    for (let i = 1; i <= totalEach; i++) {
      const u = await createUser(
        `employee${i}@seed.local`,
        `emp_seed_${i}`,
        `Employee ${i}`,
        "employee",
      )
      await createEmployee(u._id, i)
    }

    console.log("Seeding employers...")
    for (let i = 1; i <= totalEach; i++) {
      const u = await createUser(
        `employer${i}@seed.local`,
        `er_seed_${i}`,
        `Employer ${i}`,
        "employer",
      )
      await createEmployer(u._id, i)
    }

    console.log("Seeding both-role users...")
    for (let i = 1; i <= totalEach; i++) {
      const u = await createUser(
        `both${i}@seed.local`,
        `both_seed_${i}`,
        `Both User ${i}`,
        "both",
      )
      await createEmployee(u._id, i)
      await createEmployer(u._id, i)
    }

    console.log("🎉 Seeding complete")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await mongoose.disconnect()
    console.log("🔌 Disconnected")
    process.exit(0)
  }
}

run()
