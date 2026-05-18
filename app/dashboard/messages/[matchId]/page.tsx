"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { MessagesPageContent } from "../page"

export default function ChatPage() {
  const params = useParams()
  const matchId = params?.matchId as string | undefined

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesPageContent
        initialMatchId={matchId}
        showListPane={false}
        showChatPane
      />
    </Suspense>
  )
}
