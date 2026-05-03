"use client"

import { ReactNode, useEffect, useState } from "react"
import { SettingsSidebar } from "@/components/settings-sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function SettingsLayout({ children }: { children: ReactNode }) {
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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 border-r border-border bg-card lg:block overflow-y-auto fixed left-0 top-0 bottom-0 z-40">
        <SettingsSidebar />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:ml-64">
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0 lg:hidden">
              <SettingsSidebar onClose={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
