import mongoose from "mongoose"

async function wipeDatabase() {
  await mongoose.connect("mongodb://localhost:27017/swrk")

  console.log("💣 Dropping entire database...")
  await mongoose.connection.dropDatabase()

  console.log("✅ Database dropped")
  await mongoose.connection.close()
}

wipeDatabase().catch(async (err) => {
  console.error("❌ Error:", err)
  await mongoose.connection.close()
})
