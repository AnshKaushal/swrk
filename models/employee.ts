import mongoose from "mongoose"

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: String,
    locationType: { type: String, enum: ["remote", "onsite", "hybrid"] },
    startDate: Date,
    endDate: Date, // null = current
    isCurrent: { type: Boolean, default: false },
    description: String,
    skills: [String], // skills used in this role
  },
  { _id: false },
)

const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true },
    degree: String, // e.g. "B.Tech", "MBA"
    field: String, // e.g. "Computer Science"
    startYear: Number,
    endYear: Number,
    grade: String,
  },
  { _id: false },
)

const CertificationSchema = new mongoose.Schema(
  {
    name: String,
    issuedBy: String,
    issuedAt: Date,
    expiresAt: Date,
    credentialUrl: String,
  },
  { _id: false },
)

const ProjectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    url: String,
    techStack: [String],
    year: Number,
  },
  { _id: false },
)

const SocialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["github", "dribbble", "behance", "twitter", "website", "other"],
    },
    url: String,
  },
  { _id: false },
)

const EmployeeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    headline: { type: String, maxlength: 120 },
    bio: { type: String, maxlength: 500 },
    tagline: { type: String, maxlength: 80 },

    currentStatus: {
      type: String,
      enum: ["actively-looking", "open-to-offers", "not-looking"],
      default: "open-to-offers",
    },
    availableFrom: Date,

    desiredRoles: [String],
    desiredIndustries: [String],
    desiredCompanyTypes: [
      {
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
    ],
    desiredCompanies: [String],
    desiredCompanySize: {
      min: Number,
      max: Number,
    },

    currentCity: String,
    currentCountry: { type: String, default: "India" },
    preferredLocations: [String],
    willingToRelocate: { type: Boolean, default: false },
    workPreference: {
      type: String,
      enum: ["remote", "onsite", "hybrid", "any"],
      default: "any",
    },

    currentCTC: {
      amount: Number,
      currency: { type: String, default: "INR" },
      period: { type: String, enum: ["annual", "monthly"], default: "annual" },
    },
    expectedCTC: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
      period: { type: String, enum: ["annual", "monthly"], default: "annual" },
      isNegotiable: { type: Boolean, default: true },
    },
    employmentType: [
      {
        type: String,
        enum: ["full-time", "part-time", "freelance", "contract", "internship"],
      },
    ],

    totalExperienceYears: { type: Number, default: 0 },
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
    workHistory: [ExperienceSchema],

    primarySkills: [String], // top 5-6 shown on card
    secondarySkills: [String], // broader list
    languages: [
      {
        name: String,
        proficiency: {
          type: String,
          enum: ["basic", "conversational", "fluent", "native"],
        },
      },
    ],

    education: [EducationSchema],
    highestQualification: {
      type: String,
      enum: ["high-school", "diploma", "bachelors", "masters", "phd", "other"],
    },

    certifications: [CertificationSchema],
    projects: [ProjectSchema],

    socialLinks: [SocialLinkSchema],
    cvUrl: String,
    cvUploadedAt: Date,

    companyRatingMin: { type: Number, min: 1, max: 5 },
    avoidCompanies: [String],
    preferredBenefits: [
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

    isBoosted: { type: Boolean, default: false },
    boostedUntil: Date,
    boostCount: { type: Number, default: 0 },
    profileCompletionScore: { type: Number, default: 0 }, // 0-100
    isVisible: { type: Boolean, default: true },

    stats: {
      totalViews: { type: Number, default: 0 },
      totalRightSwipes: { type: Number, default: 0 },
      totalLeftSwipes: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 }, // percentage
    },
  },
  { timestamps: true },
)

EmployeeProfileSchema.index({ currentStatus: 1, isVisible: 1 })
EmployeeProfileSchema.index({ desiredRoles: 1 })
EmployeeProfileSchema.index({ primarySkills: 1 })
EmployeeProfileSchema.index({ "expectedCTC.min": 1, "expectedCTC.max": 1 })
EmployeeProfileSchema.index({ workPreference: 1 })
EmployeeProfileSchema.index({ preferredLocations: 1 })
EmployeeProfileSchema.index({ experienceLevel: 1 })
EmployeeProfileSchema.index({ isBoosted: -1, "stats.totalRightSwipes": -1 })

export default mongoose.models.EmployeeProfile ||
  mongoose.model("EmployeeProfile", EmployeeProfileSchema)
