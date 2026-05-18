"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []))
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="py-2">Matched At</th>
                  <th className="py-2">Employer</th>
                  <th className="py-2">Employee</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m._id} className="odd:bg-muted/50 align-top">
                    <td className="py-3">
                      {new Date(m.matchedAt).toLocaleString()}
                    </td>
                    <td className="py-3">
                      {m.employer?.name || m.employer?.username}
                    </td>
                    <td className="py-3">
                      {m.employee?.name || m.employee?.username}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          m.status === "active" ? "secondary" : "destructive"
                        }
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm">View</Button>
                        <Button size="sm" variant="ghost">
                          Open Chat
                        </Button>
                      </div>
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
