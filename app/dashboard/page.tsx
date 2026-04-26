"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Welcome, {session.user.name}!
          </h2>
          <p className="text-muted-foreground">
            Your onboarding is complete. This is your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
