import mongoose from "mongoose"

const PositionSwipeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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

    direction: {
      type: String,
      enum: ["left", "right", "super"],
      required: true,
    },

    applicationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    applicationStatus: {
      type: String,
      enum: [
        "submitted",
        "viewed",
        "shortlisted",
        "interview",
        "rejected",
        "hired",
        "withdrawn",
      ],
    },

    applicationSubmittedAt: Date,

    applicationStatusUpdatedAt: Date,

    applicationStatusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
)

PositionSwipeSchema.index({ candidateId: 1, positionId: 1 }, { unique: true })
PositionSwipeSchema.index({ positionId: 1, direction: 1 })
PositionSwipeSchema.index({ candidateId: 1, createdAt: -1 })
PositionSwipeSchema.index({ employerId: 1, positionId: 1 })

export default mongoose.models.PositionSwipe ||
  mongoose.model("PositionSwipe", PositionSwipeSchema)
