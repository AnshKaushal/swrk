import mongoose from "mongoose"

const BoostUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

BoostUsageSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.BoostUsage ||
  mongoose.model("BoostUsage", BoostUsageSchema)
