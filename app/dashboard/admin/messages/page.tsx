"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function truncate(s: string | undefined, n = 140) {
  if (!s) return ""
  return s.length > n ? s.slice(0, n) + "…" : s
}

export default function Page() {
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => setRecent(d.recent || []))
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.map((m) => (
              <div
                key={m._id}
                className="p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {m.sender?.name || m.sender?.username}
                  </div>
                  <Badge className="text-xs">
                    {new Date(m.createdAt).toLocaleString()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {truncate(m.content)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
