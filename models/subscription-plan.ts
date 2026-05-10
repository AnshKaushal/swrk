import mongoose from "mongoose"

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    interval: {
      type: String,
      enum: ["month", "year"],
      required: true,
    },
    razorpayPlanId: {
      type: String,
      required: true,
      unique: true,
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    benefits: {
      priorityMatching: { type: Boolean, default: false },
      unlimitedSwipes: { type: Boolean, default: false },
      advancedFilters: { type: Boolean, default: false },
      profileBoost: { type: Number, default: 0 }, // Number of boosts per month
      analytics: { type: Boolean, default: false },
      premiumSupport: { type: Boolean, default: false },
      hideAds: { type: Boolean, default: false },
      earlyAccess: { type: Boolean, default: false },
      jobPostsLimit: { type: Number, default: 0 }, // 0 = unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

SubscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 })
SubscriptionPlanSchema.index({ name: 1, interval: 1 }, { unique: true })

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", SubscriptionPlanSchema)
