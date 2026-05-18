import { config } from "dotenv"

config({ path: ".env.local" })

import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import User from "../models/user.ts"

async function main() {
  const email = process.env.ADMIN_USER?.trim().toLowerCase()
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !username || !password) {
    throw new Error(
      "ADMIN_USER, ADMIN_USERNAME, and ADMIN_PASSWORD must be set in .env.local",
    )
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env.local")
  }

  await mongoose.connect(uri)

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        username,
        name: "Admin",
        password: passwordHash,
        authProvider: "email",
        isVerified: true,
        isAdmin: true,
        adminRole: "super-admin",
        role: "both",
        activeRole: "employee",
        onboardingCompleted: true,
        onboardingStep: 4,
        isActive: true,
        isBanned: false,
      },
    },
    { upsert: true, new: true },
  )

  console.log("Admin user seeded:", {
    id: admin._id.toString(),
    email: admin.email,
    username: admin.username,
    isAdmin: admin.isAdmin,
    adminRole: admin.adminRole,
  })

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error("Error seeding admin:", error)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})