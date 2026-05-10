import { auth } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/mongodb"
import Interview from "@/models/interview"
import InterviewFeedback from "@/models/interview-feedback"
import { NextRequest, NextResponse } from "next/server"

function normalizeRating(value: unknown) {
  const numberValue = typeof value === "string" ? parseInt(value, 10) : value
  if (typeof numberValue !== "number" || Number.isNaN(numberValue)) return null
  if (numberValue < 1 || numberValue > 5) return null
  return numberValue
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { id } = await params
    const interview = await Interview.findById(id).lean()

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      )
    }

    if (
      interview.employee.toString() !== session.user.id &&
      interview.employer.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const existingFeedback = await InterviewFeedback.findOne({
      interview: interview._id,
      respondent: session.user.id,
    }).lean()

    const scheduledDate = new Date(interview.scheduledFor)
    const canSubmit =
      interview.status === "completed" || scheduledDate.getTime() <= Date.now()

    return NextResponse.json({
      existingFeedback,
      canSubmit,
      interviewStatus: interview.status,
    })
  } catch (error) {
    console.error("Failed to load interview feedback", error)
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db()

    const { id } = await params
    const interview = await Interview.findById(id)

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      )
    }

    const isEmployer = interview.employer.toString() === session.user.id
    const isEmployee = interview.employee.toString() === session.user.id

    if (!isEmployer && !isEmployee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const scheduledDate = new Date(interview.scheduledFor)
    const canSubmit =
      interview.status === "completed" || scheduledDate.getTime() <= Date.now()

    if (!canSubmit) {
      return NextResponse.json(
        { error: "Feedback will open after the interview" },
        { status: 400 },
      )
    }

    const body = await req.json()
    const ratings = {
      responsiveness: normalizeRating(body?.ratings?.responsiveness),
      communication: normalizeRating(body?.ratings?.communication),
      professionalism: normalizeRating(body?.ratings?.professionalism),
      punctuality: normalizeRating(body?.ratings?.punctuality),
      overall: normalizeRating(body?.ratings?.overall),
    }

    if (Object.values(ratings).some((value) => value === null)) {
      return NextResponse.json(
        { error: "All ratings must be between 1 and 5" },
        { status: 400 },
      )
    }

    const notes = typeof body?.notes === "string" ? body.notes.trim() : ""
    const wouldWorkAgain = Boolean(body?.wouldWorkAgain)

    const respondentRole = isEmployer ? "employer" : "employee"
    const targetRole = isEmployer ? "employee" : "employer"
    const targetUser = isEmployer ? interview.employee : interview.employer

    const feedback = await InterviewFeedback.findOneAndUpdate(
      {
        interview: interview._id,
        respondent: session.user.id,
      },
      {
        $set: {
          interview: interview._id,
          respondent: session.user.id,
          respondentRole,
          targetUser,
          targetRole,
          ratings,
          wouldWorkAgain,
          notes,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true },
    )

    const feedbackCount = await InterviewFeedback.countDocuments({
      interview: interview._id,
    })

    if (feedbackCount >= 2 && interview.status !== "completed") {
      interview.status = "completed"
      await interview.save()
    }

    return NextResponse.json({ feedback: feedback.toObject(), interview })
  } catch (error) {
    console.error("Failed to save interview feedback", error)
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    )
  }
}
