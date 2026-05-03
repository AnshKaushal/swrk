import { config } from "dotenv"
config({ path: ".env.local" })
import mongoose from "mongoose"
import SubscriptionPlan from "@/models/subscription-plan"

async function checkPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    const plans = await SubscriptionPlan.find({})
    console.log("Subscription plans in database:")
    plans.forEach((plan) => {
      console.log(
        `- ${plan.displayName}: ₹${plan.price}/${plan.interval} (Razorpay ID: ${plan.razorpayPlanId})`,
      )
    })
    await mongoose.disconnect()
  } catch (error) {
    console.error("Error:", error)
  }
}

checkPlans()
