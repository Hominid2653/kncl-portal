import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { useTransfers } from '@/context/TransferContext'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<TransferRecord, unknown>[] = [
  { accessorKey: 'playerName', header: 'Player' },
  { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={transferStatusVariants[row.original.status]}>{transferStatusLabels[row.original.status]}</Badge> },
  { accessorKey: 'submittedAt', header: 'Submitted' },
]

export default function ClubTransfersPage() {
  const { transfers } = useTransfers()

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Inter-club moves initiated from accepted engagements. Manual transfer entry is restricted to league coordinators.
          </p>
        </div>
        <Alert>
          <AlertTitle>Engagement-first workflow</AlertTitle>
          <AlertDescription>
            Start from <Link to="/club/engagements" className="underline">Engagements</Link> after a selling captain accepts interest in a committed player.
          </AlertDescription>
        </Alert>
        <DataTable columns={columns} data={transfers} searchKey="playerName" searchPlaceholder="Search..." />
      </div>
    </PortalLayout>
  )
}
