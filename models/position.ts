import mongoose from "mongoose"

const ApplicationFormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "short-text",
        "long-text",
        "email",
        "number",
        "select",
        "multiselect",
        "url",
        "phone",
        "date",
      ],
      default: "short-text",
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: [{ type: String, trim: true }],
    autofillSource: {
      type: String,
      enum: [
        "none",
        "name",
        "email",
        "phone",
        "headline",
        "bio",
        "location",
        "skills",
        "experienceYears",
        "resumeUrl",
        "linkedin",
        "github",
        "portfolio",
      ],
      default: "none",
    },
  },
  { _id: false },
)

const ApplicationFormSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Application form" },
    description: {
      type: String,
      default: "Tell us a bit more about yourself.",
    },
    fields: { type: [ApplicationFormFieldSchema], default: [] },
  },
  { _id: false },
)

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
        default: "INR",
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

    applicationForm: {
      type: ApplicationFormSchema,
      default: undefined,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    company: {
      type: String,
      default: "",
    },

    externalLink: {
      type: String,
      default: "",
    },

    isExternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

PositionSchema.index({ employerId: 1, status: 1 })
PositionSchema.index({ roles: 1 })
PositionSchema.index({ locations: 1 })
PositionSchema.index({ industry: 1 })
PositionSchema.index({ createdAt: -1 })
PositionSchema.index({ isVisible: 1, status: 1 })

if (process.env.NODE_ENV === "development" && mongoose.models.Position) {
  delete mongoose.models.Position
}

export default mongoose.models.Position ||
  mongoose.model("Position", PositionSchema)
