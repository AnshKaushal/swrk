import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    title: { type: String },
    message: { type: String },
    link: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

NotificationSchema.index({ user: 1, read: 1 })

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema)
