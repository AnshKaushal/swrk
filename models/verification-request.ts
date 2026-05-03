import mongoose from "mongoose"

const VerificationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["identity", "company"],
      required: true,
    },
    fullName: String,
    linkedinUrl: String,
    companyName: String,
    companyWebsite: String,
    description: String,
    documents: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminNote: String,
    reviewedAt: Date,
  },
  { timestamps: true },
)

VerificationRequestSchema.index({ user: 1, status: 1 })

export default mongoose.models.VerificationRequest ||
  mongoose.model("VerificationRequest", VerificationRequestSchema)
