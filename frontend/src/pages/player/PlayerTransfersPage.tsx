import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { transfers } from '@/data/mockData'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<TransferRecord, unknown>[] = [
  { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={transferStatusVariants[row.original.status]}>{transferStatusLabels[row.original.status]}</Badge> },
  { accessorKey: 'submittedAt', header: 'Submitted' },
  { accessorKey: 'reason', header: 'Reason' },
]

export default function PlayerTransfersPage() {
  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">My transfers</h1><p className="text-sm text-muted-foreground">Transfer request history.</p></div>
        <DataTable columns={columns} data={transfers} searchKey="playerName" searchPlaceholder="Search..." />
      </div>
    </PortalLayout>
  )
}
