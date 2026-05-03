import { auth } from "@/app/api/auth/[...nextauth]/route"
import HomePage from "@/components/home-page"
import { redirect } from "next/navigation"

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
