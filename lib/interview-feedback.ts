import mongoose from "mongoose"
import Interview from "@/models/interview"
import InterviewFeedback from "@/models/interview-feedback"
import PositionMatch from "@/models/position-match"

export type CredibilityStats = {
  feedbackCount: number
  overallScore: number
  responsivenessScore: number
  communicationScore: number
  professionalismScore: number
  punctualityScore: number
  recommendationRate: number
  completedInterviews: number
  hiredCount: number
}

function roundScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  return Math.round(value * 10) / 10
}

export async function getCredibilityStats(
  userId: string,
  role: "employer" | "employee",
): Promise<CredibilityStats> {
  const targetUser = new mongoose.Types.ObjectId(userId)

  const [summary] = await InterviewFeedback.aggregate([
    {
      $match: {
        targetUser,
        targetRole: role,
      },
    },
    {
      $group: {
        _id: null,
        feedbackCount: { $sum: 1 },
        overallScore: { $avg: "$ratings.overall" },
        responsivenessScore: { $avg: "$ratings.responsiveness" },
        communicationScore: { $avg: "$ratings.communication" },
        professionalismScore: { $avg: "$ratings.professionalism" },
        punctualityScore: { $avg: "$ratings.punctuality" },
        recommendationCount: {
          $sum: { $cond: ["$wouldWorkAgain", 1, 0] },
        },
      },
    },
  ])

  const completedInterviews = await Interview.countDocuments(
    role === "employer"
      ? { employer: targetUser, status: "completed" }
      : { employee: targetUser, status: "completed" },
  )

  const hiredCount = await PositionMatch.countDocuments(
    role === "employer"
      ? { employerId: targetUser, status: "hired" }
      : { candidateId: targetUser, status: "hired" },
  )

  const feedbackCount = summary?.feedbackCount || 0

  return {
    feedbackCount,
    overallScore: roundScore(summary?.overallScore),
    responsivenessScore: roundScore(summary?.responsivenessScore),
    communicationScore: roundScore(summary?.communicationScore),
    professionalismScore: roundScore(summary?.professionalismScore),
    punctualityScore: roundScore(summary?.punctualityScore),
    recommendationRate:
      feedbackCount > 0
        ? Math.round(
            ((summary?.recommendationCount || 0) / feedbackCount) * 100,
          )
        : 0,
    completedInterviews,
    hiredCount,
  }
}
