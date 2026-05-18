"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [data, setData] = useState<any>({
    signups: [],
    matches: [],
    swipes: [],
  })

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Analytics (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium">Signups</h4>
              <ul className="space-y-1 text-sm mt-2">
                {data.signups.map((s: any) => (
                  <li key={s._id} className="flex justify-between">
                    <span>{s._id}</span>
                    <span>{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Matches</h4>
              <ul className="space-y-1 text-sm mt-2">
                {data.matches.map((s: any) => (
                  <li key={s._id} className="flex justify-between">
                    <span>{s._id}</span>
                    <span>{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Swipes</h4>
              <ul className="space-y-1 text-sm mt-2">
                {data.swipes.map((s: any) => (
                  <li key={s._id} className="flex justify-between">
                    <span>{s._id}</span>
                    <span>{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
