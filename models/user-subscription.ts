import mongoose from "mongoose"

const UserSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One active subscription per user
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayCustomerId: {
      type: String,
      required: false, // Will be set when subscription is activated
    },
    status: {
      type: String,
      enum: [
        "created",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "unpaid",
      ],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: Date,
    endedAt: Date,
    trialStart: Date,
    trialEnd: Date,
    amount: {
      type: Number,
      required: true,
    },
    // Positive credit (in the same currency units as amount) applied to future invoices
    credit: {
      type: Number,
      default: 0,
    },
    // Positive balance due that should be collected from the customer (prorated upgrades)
    balanceDue: {
      type: Number,
      default: 0,
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
    paymentMethod: {
      type: String,
      enum: ["card", "netbanking", "wallet", "upi"],
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    failedPaymentCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

UserSubscriptionSchema.index({ status: 1 })
UserSubscriptionSchema.index({ currentPeriodEnd: 1 })

export default mongoose.models.UserSubscription ||
  mongoose.model("UserSubscription", UserSubscriptionSchema)
