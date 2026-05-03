import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "linkedin"],
      default: "email",
    },
    oauthId: String,

    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    avatar: String,
    banner: String,
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer-not-to-say"],
    },
    activeRole: {
      type: String,
      enum: ["employee", "employer"],
    },

    role: {
      type: String,
      enum: ["employer", "employee", "both"], // "both" allows switching
      default: null, // null until onboarding role-selection step
    },

    onboardingStep: {
      type: Number,
      default: 0, // 0=not started, 1=basic, 2=role, 3=profile, 4=done
    },
    onboardingCompleted: { type: Boolean, default: false },

    linkedinUrl: String,
    linkedinId: String,
    githubUrl: String,
    portfolioUrl: String,
    professionalLinks: [
      {
        label: String,
        url: String,
      },
    ],
    featuredResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpiry: Date,
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    pendingEmailChangeToken: String,
    pendingEmailChangeTokenExpiry: Date,
    pendingAccountDeletionToken: String,
    pendingAccountDeletionTokenExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    bannedAt: Date,
    lastSeen: Date,
    isOnline: { type: Boolean, default: false },

    isPremium: { type: Boolean, default: false },
    premiumPlan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free",
    },
    premiumExpiresAt: Date,
    premiumStartedAt: Date,

    notifications: {
      email: {
        newMatch: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        profileViewed: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
      },
      push: {
        newMatch: { type: Boolean, default: true },
        newMessage: { type: Boolean, default: true },
        profileViewed: { type: Boolean, default: false },
        reminders: { type: Boolean, default: true },
      },
    },

    privacy: {
      showLinkedin: { type: Boolean, default: false }, // shown only after match
      showPhone: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: true },
      showResumes: { type: Boolean, default: true },
      profileVisibility: {
        type: String,
        enum: ["public", "verified-only", "hidden"],
        default: "public",
      },
    },

    isAdmin: { type: Boolean, default: false },
    adminRole: {
      type: String,
      enum: ["super-admin", "moderator", "support", null],
      default: null,
    },

    reportCount: { type: Number, default: 0 },
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        description: String,
        createdAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["pending", "reviewed", "dismissed"],
          default: "pending",
        },
      },
    ],
    profileVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1, isBanned: 1 })
UserSchema.index({ isPremium: 1 })
UserSchema.index({ username: 1 }, { unique: true, sparse: true })

export default mongoose.models.User || mongoose.model("User", UserSchema)
