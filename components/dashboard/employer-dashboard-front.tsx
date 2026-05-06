"use client"

import { RecruiterDashboard } from "@/components/dashboard/recruiter-dashboard"

export function EmployerDashboardFront({ name }: { name: string }) {
  return <RecruiterDashboard name={name} />
}
