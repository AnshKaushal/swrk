"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Page() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports?limit=200")
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleAction = async (
    id: string,
    action: string,
    reason = "",
    message = "",
  ) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, message }),
      })
      const data = await res.json()
      if (data.ok || data.user) {
        // mark local as reviewed
        setReports((prev) => prev.filter((r) => String(r._id) !== String(id)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="p-6">
      <Card className="border border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-sm text-muted-foreground">No reports</div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <ReportRow key={r._id} r={r} onAction={handleAction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function ReportRow({
  r,
  onAction,
}: {
  r: any
  onAction: (
    id: string,
    action: string,
    reason?: string,
    message?: string,
  ) => void
}) {
  const [openWarn, setOpenWarn] = useState(false)
  const [openBan, setOpenBan] = useState(false)
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">
            {r.reporter?.name || r.reporter?.username || "Reporter"}
          </div>
          <Badge className="text-xs">
            {new Date(r.createdAt).toLocaleString()}
          </Badge>
        </div>
        <div className="text-sm mt-1">
          Reported:{" "}
          {r.reportedUser?.name ||
            r.reportedUser?.username ||
            (r.data?.reportedUserId ?? "unknown")}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Reason: {r.data?.reason || "—"}
        </div>
        {r.data?.description ? (
          <div className="text-xs text-muted-foreground mt-1">
            {r.data.description}
          </div>
        ) : null}
      </div>

      <div className="flex gap-2 items-start">
        <AlertDialog open={openWarn} onOpenChange={setOpenWarn}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              Warn
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send warning</AlertDialogTitle>
              <div className="text-sm text-muted-foreground">
                Optional message to the user (shown in warning notification)
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-3 p-2 rounded border border-border bg-background text-sm"
                placeholder="Message to user"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mt-3 p-2 rounded border border-border bg-background text-sm"
                placeholder="Optional reason for audit log"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onAction(r._id, "warn", reason, message)
                  setOpenWarn(false)
                  setMessage("")
                  setReason("")
                }}
              >
                Send Warning
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={openBan} onOpenChange={setOpenBan}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Ban
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Ban</AlertDialogTitle>
              <div className="text-sm text-muted-foreground">
                Provide a ban reason (recorded in audit log)
              </div>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mt-3 p-2 rounded border border-border bg-background text-sm"
                placeholder="Reason for ban"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onAction(r._id, "ban", reason)
                  setOpenBan(false)
                  setReason("")
                }}
              >
                Ban User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
