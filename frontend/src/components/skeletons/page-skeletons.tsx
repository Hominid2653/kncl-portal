import { Skeleton } from '@/components/ui/skeleton'

export function PageHeaderSkeleton({ withDescription = true }: { withDescription?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      {withDescription && <Skeleton className="h-4 w-72 max-w-full" />}
    </div>
  )
}

export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ActivityListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border px-4 py-3">
          <Skeleton className="mb-2 h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
      ))}
    </div>
  )
}
