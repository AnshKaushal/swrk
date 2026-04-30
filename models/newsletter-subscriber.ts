import mongoose from "mongoose"

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    unsubscribeToken: String,
    isUnsubscribed: {
      type: Boolean,
      default: false,
    },
    unsubscribedAt: Date,
    subscribedAt: Date,
    verifiedAt: Date,
    lastRequestedAt: Date,
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.NewsletterSubscriber ||
  mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema)
