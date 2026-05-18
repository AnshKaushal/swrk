"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

export default function Page() {
  const [subs, setSubs] = useState<any[]>([])
  const [revenue, setRevenue] = useState(0)

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        setSubs(d.subs || [])
        setRevenue(d.revenue || 0)
      })
      .catch(console.error)
  }, [])

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md mb-4">
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            Monthly revenue (active):{" "}
            <span className="font-semibold">{INR.format(revenue)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {subs.map((s) => (
              <li
                key={s._id}
                className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">
                    {s.user?.name || s.user?.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.status}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {INR.format(s.amount)}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
