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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Page() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users?limit=200")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleBan = async (id: string, ban: boolean, reason = "") => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: ban ? "ban" : "unban", reason }),
      })
      const data = await res.json()
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u._id === data.user._id ? data.user : u)),
        )
        // write audit log
        try {
          await fetch("/api/admin/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: ban ? "ban_user" : "unban_user",
              targetType: "user",
              targetId: id,
              reason,
            }),
          })
        } catch (err) {
          console.error("audit log failed", err)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  function BanDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState("")
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant={user.isBanned ? "secondary" : "destructive"}
          >
            {user.isBanned ? "Unban" : "Ban"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isBanned ? "Confirm unban" : "Confirm ban"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {user.isBanned ? "unban" : "ban"}{" "}
              {user.name} ({user.username})? This action will be logged.
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
            <AlertDialogAction
              onClick={() => {
                toggleBan(user._id, !user.isBanned, reason)
                setOpen(false)
                setReason("")
              }}
            >
              {user.isBanned ? "Unban user" : "Ban user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <main className="p-6">
      <Card className="border border-border/50">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2">Name</th>
                    <th className="py-2">Username</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Banned</th>
                    <th className="py-2">Reports</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="odd:bg-muted/50 align-top">
                      <td className="py-3">{u.name}</td>
                      <td className="py-3">{u.username}</td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">
                        {u.isAdmin ? (
                          <Badge>Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {u.isBanned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </td>
                      <td className="py-3">{u.reportCount || 0}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant={
                                  u.isBanned ? "secondary" : "destructive"
                                }
                              >
                                {u.isBanned ? "Unban" : "Ban"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {u.isBanned ? "Confirm unban" : "Confirm ban"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to{" "}
                                  {u.isBanned ? "unban" : "ban"} {u.name} (
                                  {u.username})? This action will be logged.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => toggleBan(u._id, !u.isBanned)}
                                >
                                  {u.isBanned ? "Unban user" : "Ban user"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
