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
    userType: {
      type: String,
      enum: ["employee", "employer", "both"],
      required: true,
      default: "employee",
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
      profileBoost: { type: Number, default: 0 },
      analytics: { type: Boolean, default: false },
      premiumSupport: { type: Boolean, default: false },
      hideAds: { type: Boolean, default: false },
      earlyAccess: { type: Boolean, default: false },
      jobPostsLimit: { type: Number, default: 0 },
      candidateLikesLimit: { type: Number, default: 0 },
      dailySwipesLimit: { type: Number, default: 10 },
      reachLevel: {
        type: String,
        enum: ["basic", "standard", "premium"],
        default: "basic",
      },
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
SubscriptionPlanSchema.index({ userType: 1, isActive: 1 })
SubscriptionPlanSchema.index(
  { name: 1, userType: 1, interval: 1 },
  { unique: true },
)

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", SubscriptionPlanSchema)
