import type { Metadata } from "next"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import HomePage from "@/components/home-page"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Swrk | Mutual hiring and job matching",
  description:
    "Discover a mutual matching platform for job seekers and hiring teams built around intent, trust, and faster hiring.",
}

export default async function Page() {
  const session = await auth()

  if (session?.user?.id) {
    if (session.user.onboardingCompleted) {
      redirect("/dashboard")
    }

    redirect("/onboarding")
  }

  return <HomePage />
}
