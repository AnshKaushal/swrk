import { config } from "dotenv"
config({ path: ".env.local" })

import mongoose from "mongoose"
import User from "../models/user"

async function main() {
  const userId = process.argv[2]

  if (!userId) {
    console.error("Usage: npx tsx scripts/check-user.ts <userId>")
    process.exit(1)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env.local")
  }

  await mongoose.connect(uri)

  console.log("connected to:", mongoose.connection.name)

  const count = await User.countDocuments()
  console.log("user count:", count)

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log("Invalid ObjectId:", userId)
  } else {
    const user = await User.findById(userId).lean()
    console.log("user:", user || "not found")
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error("Error:", error)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
