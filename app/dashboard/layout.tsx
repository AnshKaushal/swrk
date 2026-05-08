"use client"

import { ReactNode, useEffect, useState } from "react"
import { Menu } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardProvider } from "@/components/dashboard-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-64 overflow-y-auto border-r border-border bg-card lg:block">
          <DashboardSidebar />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:ml-64">
          <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-72 p-0 lg:hidden">
                <DashboardSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex-1" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </DashboardProvider>
  )
}
