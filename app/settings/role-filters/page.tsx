"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type EmployeeFiltersForm = {
  experienceLevel: string
  totalExperienceYears: string
  highestQualification: string
  desiredRoles: string
  desiredIndustries: string
  desiredCompanyTypes: string
  desiredCompanies: string
  desiredCompanySizeMin: string
  desiredCompanySizeMax: string
  preferredLocations: string
  willingToRelocate: boolean
  workPreference: string
  currentCTCAmount: string
  currentCTCCurrency: string
  currentCTCPeriod: "annual" | "monthly"
  expectedCTCMin: string
  expectedCTCMax: string
  expectedCTCCurrency: string
  expectedCTCPeriod: "annual" | "monthly"
  expectedCTCNegotiable: boolean
  employmentTypes: string
  companyRatingMin: string
  avoidCompanies: string
  preferredBenefits: string
}

type EmployerFiltersForm = {
  roles: string
  skills: string
  experienceLevels: string
  experienceMin: string
  experienceMax: string
  qualification: string
  locations: string
  workPreference: string
  ctcBudgetMin: string
  ctcBudgetMax: string
  currency: string
  employmentTypes: string
  candidateStatus: string
}

type EmployerFiltersPayload = {
  roles?: unknown[]
  skills?: unknown[]
  experienceLevels?: unknown[]
  experienceMin?: number
  experienceMax?: number
  qualification?: string
  locations?: unknown[]
  workPreference?: unknown[]
  ctcBudgetMin?: number
  ctcBudgetMax?: number
  currency?: string
  employmentTypes?: unknown[]
  candidateStatus?: unknown[]
}

type ProfileApiResponse = {
  user?: {
    role?: string
    activeRole?: string
  }
  activeRole?: string
  employeeProfile?: {
    experienceLevel?: string
    totalExperienceYears?: number
    highestQualification?: string
    desiredRoles?: unknown[]
    desiredIndustries?: unknown[]
    desiredCompanyTypes?: unknown[]
    desiredCompanies?: unknown[]
    desiredCompanySize?: { min?: number; max?: number }
    preferredLocations?: unknown[]
    willingToRelocate?: boolean
    workPreference?: string
    currentCTC?: { amount?: number; currency?: string; period?: string }
    expectedCTC?: {
      min?: number
      max?: number
      currency?: string
      period?: string
      isNegotiable?: boolean
    }
    employmentType?: unknown[]
    companyRatingMin?: number
    avoidCompanies?: unknown[]
    preferredBenefits?: unknown[]
  }
  employerProfile?: {
    filters?: EmployerFiltersPayload
  }
}

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const joinCsv = (values: unknown) =>
  Array.isArray(values) ? values.join(", ") : ""

const createEmployeeFilters = (): EmployeeFiltersForm => ({
  experienceLevel: "",
  totalExperienceYears: "",
  highestQualification: "",
  desiredRoles: "",
  desiredIndustries: "",
  desiredCompanyTypes: "",
  desiredCompanies: "",
  desiredCompanySizeMin: "",
  desiredCompanySizeMax: "",
  preferredLocations: "",
  willingToRelocate: false,
  workPreference: "",
  currentCTCAmount: "",
  currentCTCCurrency: "INR",
  currentCTCPeriod: "annual",
  expectedCTCMin: "",
  expectedCTCMax: "",
  expectedCTCCurrency: "INR",
  expectedCTCPeriod: "annual",
  expectedCTCNegotiable: true,
  employmentTypes: "",
  companyRatingMin: "",
  avoidCompanies: "",
  preferredBenefits: "",
})

const createEmployerFilters = (): EmployerFiltersForm => ({
  roles: "",
  skills: "",
  experienceLevels: "",
  experienceMin: "",
  experienceMax: "",
  qualification: "",
  locations: "",
  workPreference: "",
  ctcBudgetMin: "",
  ctcBudgetMax: "",
  currency: "INR",
  employmentTypes: "",
  candidateStatus: "",
})

// Enum options mirrored from models/employee.ts
const COMPANY_TYPE_OPTIONS = [
  "startup",
  "mid-size",
  "enterprise",
  "mnc",
  "product",
  "service",
  "ngo",
  "government",
]

const EMPLOYMENT_TYPE_OPTIONS = [
  "full-time",
  "part-time",
  "freelance",
  "contract",
  "internship",
]

const PREFERRED_BENEFITS_OPTIONS = [
  "health-insurance",
  "esop",
  "flexible-hours",
  "wfh",
  "paid-leaves",
  "learning-budget",
  "gym",
  "food",
  "cab",
  "bonus",
  "pension",
  "childcare",
]

const EXPERIENCE_LEVEL_OPTIONS = [
  "fresher",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "executive",
]

const normalizeEmployeeFilters = (
  profile?: ProfileApiResponse["employeeProfile"],
): EmployeeFiltersForm => ({
  experienceLevel: profile?.experienceLevel || "",
  totalExperienceYears: profile?.totalExperienceYears
    ? String(profile.totalExperienceYears)
    : "",
  highestQualification: profile?.highestQualification || "",
  desiredRoles: joinCsv(profile?.desiredRoles),
  desiredIndustries: joinCsv(profile?.desiredIndustries),
  desiredCompanyTypes: joinCsv(profile?.desiredCompanyTypes),
  desiredCompanies: joinCsv(profile?.desiredCompanies),
  desiredCompanySizeMin: profile?.desiredCompanySize?.min
    ? String(profile.desiredCompanySize.min)
    : "",
  desiredCompanySizeMax: profile?.desiredCompanySize?.max
    ? String(profile.desiredCompanySize.max)
    : "",
  preferredLocations: joinCsv(profile?.preferredLocations),
  willingToRelocate: Boolean(profile?.willingToRelocate),
  workPreference: profile?.workPreference || "",
  currentCTCAmount: profile?.currentCTC?.amount
    ? String(profile.currentCTC.amount)
    : "",
  currentCTCCurrency: profile?.currentCTC?.currency || "INR",
  currentCTCPeriod:
    profile?.currentCTC?.period === "monthly" ? "monthly" : "annual",
  expectedCTCMin: profile?.expectedCTC?.min
    ? String(profile.expectedCTC.min)
    : "",
  expectedCTCMax: profile?.expectedCTC?.max
    ? String(profile.expectedCTC.max)
    : "",
  expectedCTCCurrency: profile?.expectedCTC?.currency || "INR",
  expectedCTCPeriod:
    profile?.expectedCTC?.period === "monthly" ? "monthly" : "annual",
  expectedCTCNegotiable: profile?.expectedCTC?.isNegotiable ?? true,
  employmentTypes: joinCsv(profile?.employmentType),
  companyRatingMin: profile?.companyRatingMin
    ? String(profile.companyRatingMin)
    : "",
  avoidCompanies: joinCsv(profile?.avoidCompanies),
  preferredBenefits: joinCsv(profile?.preferredBenefits),
})

const normalizeEmployerFilters = (
  filters?: EmployerFiltersPayload,
): EmployerFiltersForm => ({
  roles: joinCsv(filters?.roles),
  skills: joinCsv(filters?.skills),
  experienceLevels: joinCsv(filters?.experienceLevels),
  experienceMin: filters?.experienceMin ? String(filters.experienceMin) : "",
  experienceMax: filters?.experienceMax ? String(filters.experienceMax) : "",
  qualification: filters?.qualification || "",
  locations: joinCsv(filters?.locations),
  workPreference: joinCsv(filters?.workPreference),
  ctcBudgetMin: filters?.ctcBudgetMin ? String(filters.ctcBudgetMin) : "",
  ctcBudgetMax: filters?.ctcBudgetMax ? String(filters.ctcBudgetMax) : "",
  currency: filters?.currency || "INR",
  employmentTypes: joinCsv(filters?.employmentTypes),
  candidateStatus: joinCsv(filters?.candidateStatus),
})

export default function RoleFiltersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    role: "employee",
    activeRole: "employee",
    employeeFilters: createEmployeeFilters(),
    employerFilters: createEmployerFilters(),
  })

  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/profile/me")
      if (response.ok) {
        const data = (await response.json()) as ProfileApiResponse
        const userData = data.user ?? {}
        const normalizedRole =
          userData.role === "job-seeker"
            ? "employee"
            : userData.role || "employee"
        const activeRole =
          data.activeRole ||
          userData.activeRole ||
          (normalizedRole === "both" ? "employee" : normalizedRole)
        setFormData((prev) => ({
          ...prev,
          role: normalizedRole,
          activeRole: activeRole === "employer" ? "employer" : "employee",
          employeeFilters: normalizeEmployeeFilters(data.employeeProfile),
          employerFilters: normalizeEmployerFilters(
            data.employerProfile?.filters,
          ),
        }))
      }
    } catch (err) {
      console.error("Failed to fetch filters:", err)
      toast.error("Failed to load filters")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
      return
    }

    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchFilters()
    }
  }, [status, router, fetchFilters])

  const updateEmployeeFilters = (
    field: keyof EmployeeFiltersForm,
    value: unknown,
  ) => {
    setFormData((prev) => ({
      ...prev,
      employeeFilters: {
        ...prev.employeeFilters,
        [field]: value,
      },
    }))
  }

  const updateEmployerFilters = (
    field: keyof EmployerFiltersForm,
    value: unknown,
  ) => {
    setFormData((prev) => ({
      ...prev,
      employerFilters: {
        ...prev.employerFilters,
        [field]: value,
      },
    }))
  }

  const toggleCsvChoice = (
    field: keyof EmployeeFiltersForm | keyof EmployerFiltersForm,
    value: string,
    employer = false,
  ) => {
    if (employer) {
      const cur = String(
        formData.employerFilters[field as keyof EmployerFiltersForm] || "",
      )
      const arr = splitCsv(cur)
      const next = arr.includes(value)
        ? arr.filter((a) => a !== value)
        : [...arr, value]
      updateEmployerFilters(field as keyof EmployerFiltersForm, next.join(", "))
    } else {
      const cur = String(
        formData.employeeFilters[field as keyof EmployeeFiltersForm] || "",
      )
      const arr = splitCsv(cur)
      const next = arr.includes(value)
        ? arr.filter((a) => a !== value)
        : [...arr, value]
      updateEmployeeFilters(field as keyof EmployeeFiltersForm, next.join(", "))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const payload = {
        employeeProfile: {
          experienceLevel: formData.employeeFilters.experienceLevel,
          totalExperienceYears: formData.employeeFilters.totalExperienceYears
            ? parseInt(formData.employeeFilters.totalExperienceYears)
            : undefined,
          highestQualification: formData.employeeFilters.highestQualification,
          desiredRoles: splitCsv(formData.employeeFilters.desiredRoles),
          desiredIndustries: splitCsv(
            formData.employeeFilters.desiredIndustries,
          ),
          desiredCompanyTypes: splitCsv(
            formData.employeeFilters.desiredCompanyTypes,
          ),
          desiredCompanies: splitCsv(formData.employeeFilters.desiredCompanies),
          desiredCompanySize: {
            min: formData.employeeFilters.desiredCompanySizeMin
              ? parseInt(formData.employeeFilters.desiredCompanySizeMin)
              : undefined,
            max: formData.employeeFilters.desiredCompanySizeMax
              ? parseInt(formData.employeeFilters.desiredCompanySizeMax)
              : undefined,
          },
          preferredLocations: splitCsv(
            formData.employeeFilters.preferredLocations,
          ),
          willingToRelocate: formData.employeeFilters.willingToRelocate,
          workPreference: formData.employeeFilters.workPreference,
          currentCTC: {
            amount: formData.employeeFilters.currentCTCAmount
              ? parseInt(formData.employeeFilters.currentCTCAmount)
              : undefined,
            currency: formData.employeeFilters.currentCTCCurrency,
            period: formData.employeeFilters.currentCTCPeriod,
          },
          expectedCTC: {
            min: formData.employeeFilters.expectedCTCMin
              ? parseInt(formData.employeeFilters.expectedCTCMin)
              : undefined,
            max: formData.employeeFilters.expectedCTCMax
              ? parseInt(formData.employeeFilters.expectedCTCMax)
              : undefined,
            currency: formData.employeeFilters.expectedCTCCurrency,
            period: formData.employeeFilters.expectedCTCPeriod,
            isNegotiable: formData.employeeFilters.expectedCTCNegotiable,
          },
          employmentType: splitCsv(formData.employeeFilters.employmentTypes),
          companyRatingMin: formData.employeeFilters.companyRatingMin
            ? parseInt(formData.employeeFilters.companyRatingMin)
            : undefined,
          avoidCompanies: splitCsv(formData.employeeFilters.avoidCompanies),
          preferredBenefits: splitCsv(
            formData.employeeFilters.preferredBenefits,
          ),
        },
        employerProfile: {
          filters: {
            roles: splitCsv(formData.employerFilters.roles),
            skills: splitCsv(formData.employerFilters.skills),
            experienceLevels: splitCsv(
              formData.employerFilters.experienceLevels,
            ),
            experienceMin: formData.employerFilters.experienceMin
              ? parseInt(formData.employerFilters.experienceMin)
              : undefined,
            experienceMax: formData.employerFilters.experienceMax
              ? parseInt(formData.employerFilters.experienceMax)
              : undefined,
            qualification: formData.employerFilters.qualification,
            locations: splitCsv(formData.employerFilters.locations),
            workPreference: splitCsv(formData.employerFilters.workPreference),
            ctcBudgetMin: formData.employerFilters.ctcBudgetMin
              ? parseInt(formData.employerFilters.ctcBudgetMin)
              : undefined,
            ctcBudgetMax: formData.employerFilters.ctcBudgetMax
              ? parseInt(formData.employerFilters.ctcBudgetMax)
              : undefined,
            currency: formData.employerFilters.currency,
            employmentTypes: splitCsv(formData.employerFilters.employmentTypes),
            candidateStatus: splitCsv(formData.employerFilters.candidateStatus),
          },
        },
        user: {
          activeRole: formData.activeRole,
        },
      }

      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Filters saved successfully")
      } else {
        toast.error("Failed to save filters")
      }
    } catch (err) {
      console.error("Error saving filters:", err)
      toast.error("Error saving filters")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-x-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Role Filters</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage filters for matching and swipe discovery
            </p>
          </div>
        </div>
      </div>

      {formData.role === "both" && (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Label className="text-base">Active Role</Label>
            <p className="mt-1 text-sm text-muted-foreground mb-3">
              Choose which role&apos;s filters to manage
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={
                  formData.activeRole === "employee" ? "default" : "outline"
                }
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    activeRole: "employee",
                  }))
                }
              >
                Open to work
              </Button>
              <Button
                type="button"
                variant={
                  formData.activeRole === "employer" ? "default" : "outline"
                }
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    activeRole: "employer",
                  }))
                }
              >
                Hiring
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-base/7 font-semibold">
            {formData.activeRole === "employee"
              ? "Open to work Filters"
              : "Hiring Filters"}
          </h2>
          <p className="mt-1 text-sm/6 text-muted-foreground">
            {formData.activeRole === "employee"
              ? "Set your opportunity preferences"
              : "Target candidates for your openings"}
          </p>
        </div>
        <div className="md:col-span-2 space-y-8">
          {(formData.activeRole === "employee" ||
            formData.role === "employee") && (
            <>
              {formData.activeRole === "employee" && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <Select
                        value={formData.employeeFilters.experienceLevel}
                        onValueChange={(value) =>
                          updateEmployeeFilters("experienceLevel", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fresher">Fresher</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Experience (Years)</Label>
                      <Input
                        type="number"
                        value={formData.employeeFilters.totalExperienceYears}
                        onChange={(e) =>
                          updateEmployeeFilters(
                            "totalExperienceYears",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Highest Qualification</Label>
                      <Select
                        value={formData.employeeFilters.highestQualification}
                        onValueChange={(value) =>
                          updateEmployeeFilters("highestQualification", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high-school">
                            High School
                          </SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="bachelors">Bachelors</SelectItem>
                          <SelectItem value="masters">Masters</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Work Preference</Label>
                      <Select
                        value={formData.employeeFilters.workPreference}
                        onValueChange={(value) =>
                          updateEmployeeFilters("workPreference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="onsite">Onsite</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Desired Roles</Label>
                      <Textarea
                        value={formData.employeeFilters.desiredRoles}
                        onChange={(e) =>
                          updateEmployeeFilters("desiredRoles", e.target.value)
                        }
                        placeholder="Frontend Developer, Product Designer"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Desired Companies</Label>
                      <Textarea
                        value={formData.employeeFilters.desiredCompanies}
                        onChange={(e) =>
                          updateEmployeeFilters(
                            "desiredCompanies",
                            e.target.value,
                          )
                        }
                        placeholder="OpenAI, Stripe, Series B startups"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Desired Company Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMPANY_TYPE_OPTIONS.map((opt) => {
                          const selected = splitCsv(
                            formData.employeeFilters.desiredCompanyTypes,
                          ).includes(opt)
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                toggleCsvChoice("desiredCompanyTypes", opt)
                              }
                            >
                              {opt.replace("-", " ")}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Preferred Locations</Label>
                      <Textarea
                        value={formData.employeeFilters.preferredLocations}
                        onChange={(e) =>
                          updateEmployeeFilters(
                            "preferredLocations",
                            e.target.value,
                          )
                        }
                        placeholder="Bengaluru, Remote, London"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                      <div className="space-y-2">
                        <Label>Desired Company Size Min</Label>
                        <Input
                          type="number"
                          value={formData.employeeFilters.desiredCompanySizeMin}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "desiredCompanySizeMin",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Desired Company Size Max</Label>
                        <Input
                          type="number"
                          value={formData.employeeFilters.desiredCompanySizeMax}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "desiredCompanySizeMax",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Preferred Benefits</Label>
                      <div className="flex flex-wrap gap-2">
                        {PREFERRED_BENEFITS_OPTIONS.map((opt) => {
                          const selected = splitCsv(
                            formData.employeeFilters.preferredBenefits,
                          ).includes(opt)
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                toggleCsvChoice("preferredBenefits", opt)
                              }
                            >
                              {opt.replace("-", " ")}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Avoid Companies</Label>
                      <Textarea
                        value={formData.employeeFilters.avoidCompanies}
                        onChange={(e) =>
                          updateEmployeeFilters(
                            "avoidCompanies",
                            e.target.value,
                          )
                        }
                        placeholder="List companies you want to avoid"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 sm:col-span-2">
                      <div className="space-y-2">
                        <Label>Current CTC</Label>
                        <Input
                          type="number"
                          value={formData.employeeFilters.currentCTCAmount}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "currentCTCAmount",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Currency</Label>
                        <Input
                          value={formData.employeeFilters.currentCTCCurrency}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "currentCTCCurrency",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Period</Label>
                        <Select
                          value={formData.employeeFilters.currentCTCPeriod}
                          onValueChange={(value) =>
                            updateEmployeeFilters("currentCTCPeriod", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 sm:col-span-2">
                      <div className="space-y-2">
                        <Label>Expected CTC Min</Label>
                        <Input
                          type="number"
                          value={formData.employeeFilters.expectedCTCMin}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "expectedCTCMin",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expected CTC Max</Label>
                        <Input
                          type="number"
                          value={formData.employeeFilters.expectedCTCMax}
                          onChange={(e) =>
                            updateEmployeeFilters(
                              "expectedCTCMax",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Negotiable</Label>
                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span className="text-sm text-muted-foreground">
                            Can negotiate
                          </span>
                          <Switch
                            checked={
                              formData.employeeFilters.expectedCTCNegotiable
                            }
                            onCheckedChange={(checked) =>
                              updateEmployeeFilters(
                                "expectedCTCNegotiable",
                                checked,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:col-span-2">
                      <div>
                        <Label>Willing to Relocate</Label>
                        <p className="text-xs text-muted-foreground">
                          Show relocation preference in matching.
                        </p>
                      </div>
                      <Switch
                        checked={formData.employeeFilters.willingToRelocate}
                        onCheckedChange={(checked) =>
                          updateEmployeeFilters("willingToRelocate", checked)
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Employment Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
                          const selected = splitCsv(
                            formData.employeeFilters.employmentTypes,
                          ).includes(opt)
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                toggleCsvChoice("employmentTypes", opt)
                              }
                            >
                              {opt.replace("-", " ")}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Minimum Company Rating</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.employeeFilters.companyRatingMin}
                        onChange={(e) =>
                          updateEmployeeFilters(
                            "companyRatingMin",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {(formData.activeRole === "employer" ||
            formData.role === "employer") && (
            <>
              {formData.activeRole === "employer" && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Roles Looking For</Label>
                      <Textarea
                        value={formData.employerFilters.roles}
                        onChange={(e) =>
                          updateEmployerFilters("roles", e.target.value)
                        }
                        placeholder="Frontend Developer, HR Generalist"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Skills</Label>
                      <Textarea
                        value={formData.employerFilters.skills}
                        onChange={(e) =>
                          updateEmployerFilters("skills", e.target.value)
                        }
                        placeholder="React, MongoDB, Figma"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Experience Min</Label>
                      <Input
                        type="number"
                        value={formData.employerFilters.experienceMin}
                        onChange={(e) =>
                          updateEmployerFilters("experienceMin", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Experience Max</Label>
                      <Input
                        type="number"
                        value={formData.employerFilters.experienceMax}
                        onChange={(e) =>
                          updateEmployerFilters("experienceMax", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Experience Levels</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_LEVEL_OPTIONS.map((opt) => {
                          const selected = splitCsv(
                            formData.employerFilters.experienceLevels,
                          ).includes(opt)
                          return (
                            <Button
                              key={opt}
                              type="button"
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                toggleCsvChoice("experienceLevels", opt, true)
                              }
                            >
                              {opt}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Select
                        value={formData.employerFilters.qualification}
                        onValueChange={(value) =>
                          updateEmployerFilters("qualification", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="high-school">
                            High School
                          </SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="bachelors">Bachelors</SelectItem>
                          <SelectItem value="masters">Masters</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Locations</Label>
                      <Textarea
                        value={formData.employerFilters.locations}
                        onChange={(e) =>
                          updateEmployerFilters("locations", e.target.value)
                        }
                        placeholder="Remote, Bengaluru, Hyderabad"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Work Preference</Label>
                      <Textarea
                        value={formData.employerFilters.workPreference}
                        onChange={(e) =>
                          updateEmployerFilters(
                            "workPreference",
                            e.target.value,
                          )
                        }
                        placeholder="remote, hybrid"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                      <div className="space-y-2">
                        <Label>CTC Budget Min</Label>
                        <Input
                          type="number"
                          value={formData.employerFilters.ctcBudgetMin}
                          onChange={(e) =>
                            updateEmployerFilters(
                              "ctcBudgetMin",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CTC Budget Max</Label>
                        <Input
                          type="number"
                          value={formData.employerFilters.ctcBudgetMax}
                          onChange={(e) =>
                            updateEmployerFilters(
                              "ctcBudgetMax",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input
                        value={formData.employerFilters.currency}
                        onChange={(e) =>
                          updateEmployerFilters("currency", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Employment Types</Label>
                      <Textarea
                        value={formData.employerFilters.employmentTypes}
                        onChange={(e) =>
                          updateEmployerFilters(
                            "employmentTypes",
                            e.target.value,
                          )
                        }
                        placeholder="full-time, contract"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Candidate Status</Label>
                      <Textarea
                        value={formData.employerFilters.candidateStatus}
                        onChange={(e) =>
                          updateEmployerFilters(
                            "candidateStatus",
                            e.target.value,
                          )
                        }
                        placeholder="actively-looking, open-to-offers"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-x-6 px-4 py-5 sm:px-6 lg:px-8 border-t border-border sticky bottom-0 bg-background">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Filters"}
        </Button>
      </div>
    </div>
  )
}
