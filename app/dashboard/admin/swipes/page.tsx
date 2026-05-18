"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Page() {
  const [recent, setRecent] = useState<any[]>([])
  const [counts, setCounts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/swipes")
      .then((r) => r.json())
      .then((d) => {
        setRecent(d.recent || [])
        setCounts(d.counts || [])
      })
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md mb-4">
        <CardHeader>
          <CardTitle>Swipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {counts.map((c) => (
              <div
                key={c._id}
                className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col items-start"
              >
                <div className="text-xs text-muted-foreground">{c._id}</div>
                <div className="text-2xl font-bold">{c.count}</div>
                <Badge className="mt-2">{c._id}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Recent Swipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="py-2">When</th>
                  <th className="py-2">By</th>
                  <th className="py-2">On</th>
                  <th className="py-2">Direction</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s._id} className="odd:bg-muted/50 align-top">
                    <td className="py-3">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {s.swipedBy?.name || s.swipedBy?.username}
                    </td>
                    <td className="py-3">
                      {s.swipedOn?.name || s.swipedOn?.username}
                    </td>
                    <td className="py-3">
                      <Badge>{s.direction}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
