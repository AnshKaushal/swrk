"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [recent, setRecent] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch("/api/admin/boosts")
      .then((r) => r.json())
      .then((d) => {
        setRecent(d.recent || [])
        setTotal(d.total || 0)
      })
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md mb-4">
        <CardHeader>
          <CardTitle>Boosts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">Total boosts used: {total}</div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Recent Boost Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li
                key={r._id}
                className="p-3 rounded-lg bg-muted/30 border border-border"
              >
                {r.user?.name || r.user?.username} —{" "}
                {new Date(r.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
