import mongoose from "mongoose"

const JobOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, maxlength: 2000 },
    department: String,
    location: String,
    locationType: { type: String, enum: ["remote", "onsite", "hybrid"] },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "freelance", "contract", "internship"],
    },

    // Compensation
    ctcMin: Number,
    ctcMax: Number,
    currency: { type: String, default: "INR" },
    ctcPeriod: { type: String, enum: ["annual", "monthly"], default: "annual" },
    equityOffered: { type: Boolean, default: false },
    equityPercent: String, // "0.1% - 0.5%"

    // Requirements
    requiredSkills: [String],
    preferredSkills: [String],
    experienceMin: Number, // years
    experienceMax: Number,
    experienceLevel: {
      type: String,
      enum: [
        "fresher",
        "junior",
        "mid",
        "senior",
        "lead",
        "principal",
        "executive",
      ],
    },
    qualification: {
      type: String,
      enum: ["any", "high-school", "diploma", "bachelors", "masters", "phd"],
      default: "any",
    },

    // Perks
    perks: [
      {
        type: String,
        enum: [
          "health-insurance",
          "esop",
          "flexible-hours",
          "wfh",
          "paid-leaves",
          "learning-budget",
          "gym",
          "food",
          "cab",
          "bonus",
          "pension",
          "childcare",
        ],
      },
    ],

    isActive: { type: Boolean, default: true },
    openedAt: { type: Date, default: Date.now },
    closingAt: Date,
  },
  { _id: true, timestamps: true },
)

const EmployerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    recruiterName: String, // if individual recruiter
    recruiterTitle: String, // "Head of Talent", "CTO", "Founder"
    recruiterBio: { type: String, maxlength: 300 },

    companyName: { type: String, required: true },
    companyLogo: String, // URL
    companyWebsite: String,
    companyLinkedin: String,
    companyDescription: { type: String, maxlength: 1000 },
    companyTagline: { type: String, maxlength: 120 }, // shown on swipe card

    industry: [String], // ["Fintech", "SaaS"]
    companyType: {
      type: String,
      enum: [
        "startup",
        "mid-size",
        "enterprise",
        "mnc",
        "product",
        "service",
        "ngo",
        "government",
      ],
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-2000", "2000+"],
    },
    foundedYear: Number,
    headquarters: String,
    operatingIn: [String], // countries/cities

    fundingStage: {
      type: String,
      enum: [
        "bootstrapped",
        "pre-seed",
        "seed",
        "series-a",
        "series-b",
        "series-c+",
        "public",
        "na",
      ],
      default: "na",
    },
    totalFunding: String, // "$5M", "₹20Cr"

    culture: [String], // ["fast-paced", "collaborative", "data-driven"]
    perks: [
      {
        type: String,
        enum: [
          "health-insurance",
          "esop",
          "flexible-hours",
          "wfh",
          "paid-leaves",
          "learning-budget",
          "gym",
          "food",
          "cab",
          "bonus",
          "pension",
          "childcare",
        ],
      },
    ],
    workStyle: {
      type: String,
      enum: ["remote-first", "hybrid", "onsite-only", "flexible"],
    },
    glassdoorRating: { type: Number, min: 1, max: 5 },
    glassdoorUrl: String,

    activeOpenings: [JobOpeningSchema],

    filters: {
      roles: [String], // looking for these job titles
      skills: [String], // must-have skills
      experienceLevels: [
        {
          type: String,
          enum: [
            "fresher",
            "junior",
            "mid",
            "senior",
            "lead",
            "principal",
            "executive",
          ],
        },
      ],
      experienceMin: Number,
      experienceMax: Number,
      qualification: {
        type: String,
        enum: ["any", "high-school", "diploma", "bachelors", "masters", "phd"],
        default: "any",
      },
      locations: [String],
      workPreference: [
        {
          type: String,
          enum: ["remote", "onsite", "hybrid", "any"],
        },
      ],
      ctcBudgetMin: Number,
      ctcBudgetMax: Number,
      currency: { type: String, default: "INR" },
      employmentTypes: [
        {
          type: String,
          enum: [
            "full-time",
            "part-time",
            "freelance",
            "contract",
            "internship",
          ],
        },
      ],
      candidateStatus: [
        {
          type: String,
          enum: ["actively-looking", "open-to-offers", "not-looking"],
        },
      ],
    },

    isVerifiedCompany: { type: Boolean, default: false }, // blue tick
    dailySwipeLimit: { type: Number, default: 20 }, // increases with premium
    profileCompletionScore: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },

    stats: {
      totalProfilesViewed: { type: Number, default: 0 },
      totalRightSwipes: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      totalHires: { type: Number, default: 0 }, // self-reported
      averageResponseTime: Number, // in minutes
    },
  },
  { timestamps: true },
)

EmployerProfileSchema.index({ isVisible: 1, isVerifiedCompany: 1 })
EmployerProfileSchema.index({ companyType: 1 })
EmployerProfileSchema.index({ "filters.roles": 1 })
EmployerProfileSchema.index({ "filters.skills": 1 })
EmployerProfileSchema.index({ "activeOpenings.isActive": 1 })

export default mongoose.models.EmployerProfile ||
  mongoose.model("EmployerProfile", EmployerProfileSchema)
