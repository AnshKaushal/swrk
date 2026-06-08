import mongoose from "mongoose"

const PublicApplicationSchema = new mongoose.Schema(
  {
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    workExperience: { type: String, default: "", trim: true },
    agreedToTerms: { type: Boolean, required: true },
    applicationData: { type: mongoose.Schema.Types.Mixed, default: {} },
    isExternal: { type: Boolean, default: false },
    externalLink: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "new",
        "screened",
        "shortlisted",
        "maybe",
        "interview",
        "offer",
        "hired",
        "rejected",
        "withdrawn",
      ],
      default: "new",
    },
  },
  { timestamps: true },
)

PublicApplicationSchema.index({ positionId: 1, createdAt: -1 })
PublicApplicationSchema.index({ employerId: 1, createdAt: -1 })

export default mongoose.models.PublicApplication ||
  mongoose.model("PublicApplication", PublicApplicationSchema)
