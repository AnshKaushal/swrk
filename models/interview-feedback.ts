import mongoose from "mongoose"

const RatingSchema = new mongoose.Schema(
  {
    responsiveness: { type: Number, min: 1, max: 5, default: 3 },
    communication: { type: Number, min: 1, max: 5, default: 3 },
    professionalism: { type: Number, min: 1, max: 5, default: 3 },
    punctuality: { type: Number, min: 1, max: 5, default: 3 },
    overall: { type: Number, min: 1, max: 5, default: 3 },
  },
  { _id: false },
)

const InterviewFeedbackSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    respondentRole: {
      type: String,
      enum: ["employer", "employee"],
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetRole: {
      type: String,
      enum: ["employer", "employee"],
      required: true,
    },
    ratings: {
      type: RatingSchema,
      required: true,
      default: () => ({}),
    },
    wouldWorkAgain: { type: Boolean, default: false },
    notes: { type: String, maxlength: 1000 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

InterviewFeedbackSchema.index({ interview: 1, respondent: 1 }, { unique: true })
InterviewFeedbackSchema.index({ targetUser: 1, targetRole: 1, createdAt: -1 })

export default mongoose.models.InterviewFeedback ||
  mongoose.model("InterviewFeedback", InterviewFeedbackSchema)
