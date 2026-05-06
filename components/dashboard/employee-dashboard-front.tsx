"use client"

import { CandidateDashboard } from "@/components/dashboard/candidate-dashboard"

export function EmployeeDashboardFront({ name }: { name: string }) {
  return <CandidateDashboard name={name} />
}
