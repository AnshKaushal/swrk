"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Page() {
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => setRecent(d.recent || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDone = (id: string) => {
    setRecent((prev) => prev.filter((item) => String(item._id) !== String(id)))
  }

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card hover:shadow-md">
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No content items.
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((n) => (
                <ContentRow key={n._id} n={n} onDone={handleDone} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function ContentRow({ n, onDone }: { n: any; onDone: (id: string) => void }) {
  const [dismissOpen, setDismissOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [reason, setReason] = useState("")

  const handle = async (action: string) => {
    try {
      const res = await fetch(`/api/admin/content/${n._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      if (!res.ok) return
      onDone(String(n._id))
    } catch (err) {
      console.error(err)
    }
    setDismissOpen(false)
    setRemoveOpen(false)
    setReason("")
  }

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border flex justify-between items-start gap-3">
      <div>
        <div className="text-sm font-medium">{n.title || n.type}</div>
        <div className="text-xs text-muted-foreground">
          {n.message || JSON.stringify(n.data)}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(n.createdAt).toLocaleString()}
        </div>
      </div>
      <div className="flex items-start gap-2">
        <AlertDialog open={dismissOpen} onOpenChange={setDismissOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline">
              Dismiss
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm dismiss</AlertDialogTitle>
              <AlertDialogDescription>
                Dismiss this content? This action will be logged.
              </AlertDialogDescription>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason for audit log"
                className="w-full mt-3 p-2 rounded border border-border bg-background text-sm"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handle("dismiss")}>
                Dismiss
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm remove</AlertDialogTitle>
              <AlertDialogDescription>
                Remove this content permanently? This action will be logged.
              </AlertDialogDescription>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason for audit log"
                className="w-full mt-3 p-2 rounded border border-border bg-background text-sm"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handle("remove")}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
