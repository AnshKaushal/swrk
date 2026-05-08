import mongoose from "mongoose"

const PositionMatchSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "matched",
        "chat_started",
        "interview_scheduled",
        "rejected",
        "hired",
      ],
      default: "matched",
    },

    matchedAt: {
      type: Date,
      default: Date.now,
    },

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    lastMessageAt: Date,

    interviewIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interview",
      },
    ],

    archivedBy: [
      {
        type: String,
        enum: ["candidate", "employer"],
      },
    ],

    rejectedAt: Date,
    rejectedBy: {
      type: String,
      enum: ["candidate", "employer"],
    },
    rejectionReason: String,

    hiredAt: Date,

    notes: String,
  },
  { timestamps: true },
)

PositionMatchSchema.index(
  { candidateId: 1, employerId: 1, positionId: 1 },
  { unique: true },
)
PositionMatchSchema.index({ positionId: 1, status: 1 })
PositionMatchSchema.index({ employerId: 1, positionId: 1, status: 1 })
PositionMatchSchema.index({ candidateId: 1, status: 1 })
PositionMatchSchema.index({ matchedAt: -1 })

export default mongoose.models.PositionMatch ||
  mongoose.model("PositionMatch", PositionMatchSchema)
