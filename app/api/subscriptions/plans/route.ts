import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/mongodb"
import SubscriptionPlan from "@/models/subscription-plan"

export async function GET() {
  try {
    await db()

    const plans = await SubscriptionPlan.find({ })
      .sort({ sortOrder: 1 })
      .select("-razorpayPlanId")

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 },
    )
  }
}
