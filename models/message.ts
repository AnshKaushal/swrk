import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["employer", "employee"],
      required: true,
    },

    type: {
      type: String,
      enum: [
        "text",
        "starter",    // pre-built starter phrase (first message templates)
        "cv-share",   // system message: employee shared CV
        "linkedin",   // system message: shared LinkedIn
        "system",     // generic system messages (match created, etc.)
      ],
      default: "text",
    },

    content: { type: String, maxlength: 2000 },

    // For CV / document sharing
    attachmentUrl: String,
    attachmentType: { type: String, enum: ["cv", "portfolio", "other"] },
    attachmentName: String,

    // Read receipts
    isRead: { type: Boolean, default: false },
    readAt: Date,

    // Soft delete
    isDeletedBySender: { type: Boolean, default: false },
    isDeletedByReceiver: { type: Boolean, default: false },
  },
  { timestamps: true }
)

MessageSchema.index({ match: 1, createdAt: 1 })
MessageSchema.index({ sender: 1 })

export default mongoose.models.Message || mongoose.model("Message", MessageSchema)