"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SwipeRailDeck from "@/components/swipe/SwipeRailDeck"

export default function DashboardSwipePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return null
  }

  return <SwipeRailDeck />
}
