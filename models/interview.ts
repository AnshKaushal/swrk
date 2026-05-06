import mongoose from "mongoose"

const InterviewSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    timezone: {
      type: String,
      default: "UTC",
    },

    duration: {
      type: Number,
      default: 60,
    },

    title: {
      type: String,
      required: true,
    },

    description: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    interviewLink: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "confirmed", "denied", "completed", "cancelled"],
      default: "scheduled",
    },

    confirmedAt: Date,
    deniedAt: Date,
    deniedReason: String,

    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notificationsSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

InterviewSchema.index({ match: 1 })
InterviewSchema.index({ employer: 1, status: 1, scheduledFor: 1 })
InterviewSchema.index({ employee: 1, status: 1, scheduledFor: 1 })
InterviewSchema.index({ scheduledFor: 1, status: 1 })

export default mongoose.models.Interview ||
  mongoose.model("Interview", InterviewSchema)
