import { Suspense } from "react"
import UnsubscribeContent from "./content"

function UnsubscribeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-muted/40" />
          <div className="h-8 bg-muted/40 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-muted/40 rounded w-full" />
          <div className="h-4 bg-muted/40 rounded w-5/6 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<UnsubscribeLoading />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
