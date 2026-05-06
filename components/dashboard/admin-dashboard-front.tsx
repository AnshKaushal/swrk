"use client"

import { AdminDashboard } from "@/components/dashboard/admin-dashboard"

export function AdminDashboardFront({ name }: { name: string }) {
  return <AdminDashboard name={name} />
}
