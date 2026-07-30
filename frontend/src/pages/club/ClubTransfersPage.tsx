import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { transfers } from '@/data/mockData'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<TransferRecord, unknown>[] = [
  { accessorKey: 'playerName', header: 'Player' },
  { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={transferStatusVariants[row.original.status]}>{transferStatusLabels[row.original.status]}</Badge> },
  { accessorKey: 'submittedAt', header: 'Submitted' },
]

export default function ClubTransfersPage() {
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Transfers</h1></div>
          <Button render={<Link to="/club/transfers/new" />}><PlusIcon data-icon="inline-start" />New transfer</Button>
        </div>
        <DataTable columns={columns} data={transfers} searchKey="playerName" searchPlaceholder="Search..." />
      </div>
    </PortalLayout>
  )
}
