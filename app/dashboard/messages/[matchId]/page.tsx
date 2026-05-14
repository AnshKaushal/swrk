"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params?.matchId as string | undefined

  useEffect(() => {
    if (!matchId) return

    const nextUrl = new URL(window.location.href)
    nextUrl.pathname = "/dashboard/messages"
    nextUrl.searchParams.set("matchId", matchId)
    router.push(nextUrl.toString())
  }, [matchId])

  return (
    <div className="flex h-full items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
