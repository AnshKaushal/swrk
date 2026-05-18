"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  const [byLocation, setByLocation] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/locations")
      .then((r) => r.json())
      .then((d) => setByLocation(d.byLocation || []))
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {byLocation.map((l) => (
              <li
                key={l._id}
                className="p-3 rounded-lg bg-muted/30 border border-border flex justify-between"
              >
                <span>{l._id}</span>
                <span className="font-semibold">{l.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
