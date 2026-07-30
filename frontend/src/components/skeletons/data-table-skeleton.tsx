import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableSkeletonProps {
  columns?: number
  rows?: number
  showSearch?: boolean
}

export function DataTableSkeleton({
  columns = 4,
  rows = 8,
  showSearch = true,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {showSearch && <Skeleton className="h-9 w-full max-w-sm" />}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, row) => (
              <TableRow key={row}>
                {Array.from({ length: columns }).map((_, col) => (
                  <TableCell key={col}>
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}
