import mongoose from "mongoose"

const EmployerPositionSwipeSchema = new mongoose.Schema(
  {
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

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    direction: {
      type: String,
      enum: ["left", "right"],
      required: true,
    },
  },
  { timestamps: true },
)

EmployerPositionSwipeSchema.index(
  { employerId: 1, positionId: 1, candidateId: 1 },
  { unique: true },
)
EmployerPositionSwipeSchema.index({ positionId: 1, direction: 1 })
EmployerPositionSwipeSchema.index({ employerId: 1, positionId: 1 })
EmployerPositionSwipeSchema.index({ candidateId: 1 })

export default mongoose.models.EmployerPositionSwipe ||
  mongoose.model("EmployerPositionSwipe", EmployerPositionSwipeSchema)
