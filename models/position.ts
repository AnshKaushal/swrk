import mongoose from "mongoose"

const PositionSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    roles: [
      {
        type: String,
        trim: true,
      },
    ],

    locations: [
      {
        type: String,
        trim: true,
      },
    ],

    industry: {
      type: String,
      trim: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    experience: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "any"],
      default: "any",
    },

    salaryRange: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },

    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    matchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

PositionSchema.index({ employerId: 1, status: 1 })
PositionSchema.index({ roles: 1, locations: 1, industry: 1 })
PositionSchema.index({ createdAt: -1 })
PositionSchema.index({ isVisible: 1, status: 1 })

export default mongoose.models.Position ||
  mongoose.model("Position", PositionSchema)
