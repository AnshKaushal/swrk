import mongoose from "mongoose"

// Swipe model
// Records every individual swipe action. Used to:
//  - prevent showing the same profile twice
//  - detect mutual matches
//  - feed analytics

const SwipeSchema = new mongoose.Schema(
  {
    // Who swiped
    swipedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    swipedByRole: {
      type: String,
      enum: ["employer", "employee"],
      required: true,
    },

    // Who was swiped on
    swipedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    swipedOnRole: {
      type: String,
      enum: ["employer", "employee"],
      required: true,
    },

    direction: {
      type: String,
      enum: ["left", "right", "super"], // super = SuperSwipe (premium)
      required: true,
    },

    createdMatch: { type: Boolean, default: false },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
  },
  { timestamps: true },
)

SwipeSchema.index({ swipedBy: 1, swipedOn: 1 }, { unique: true })
SwipeSchema.index({ swipedOn: 1, direction: 1 })
SwipeSchema.index({ swipedBy: 1, createdAt: -1 })

const MatchSchema = new mongoose.Schema(
  {
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

    // Which job opening triggered this (if employer has multiple)
    jobOpeningId: mongoose.Schema.Types.ObjectId,

    status: {
      type: String,
      enum: [
        "active", // chat open
        "archived", // one side archived
        "hired", // marked as hired
        "rejected", // one side rejected post-match
        "expired", // no activity for 30 days
      ],
      default: "active",
    },

    // CV sharing
    cvSharedByEmployee: { type: Boolean, default: false },
    cvSharedAt: Date,

    // LinkedIn sharing (after they decide to connect externally)
    linkedinSharedByEmployer: { type: Boolean, default: false },
    linkedinSharedByEmployee: { type: Boolean, default: false },

    // Outcome tracking (self-reported)
    outcome: {
      type: String,
      enum: ["hired", "interviewing", "declined", "ghosted", "ongoing", null],
      default: null,
    },
    outcomeReportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    outcomeReportedAt: Date,

    // Last message preview (for match list UI)
    lastMessageAt: Date,
    lastMessagePreview: String,
    lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Unread counts per side
    unreadByEmployer: { type: Number, default: 0 },
    unreadByEmployee: { type: Number, default: 0 },

    matchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

MatchSchema.index({ employer: 1, employee: 1 }, { unique: true })
MatchSchema.index({ employer: 1, status: 1, lastMessageAt: -1 })
MatchSchema.index({ employee: 1, status: 1, lastMessageAt: -1 })

export const Swipe =
  mongoose.models.Swipe || mongoose.model("Swipe", SwipeSchema)
export const Match =
  mongoose.models.Match || mongoose.model("Match", MatchSchema)
