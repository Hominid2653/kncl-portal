import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { PlusIcon } from 'lucide-react'

import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useTransfers } from '@/context/TransferContext'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const sourceLabels: Record<NonNullable<TransferRecord['source']>, string> = {
  ENGAGEMENT: 'Engagement',
  PLAYER_REQUEST: 'Player request',
  COORDINATOR_MANUAL: 'Manual',
}

export default function AdminTransfersPage() {
  const { user } = useAuth()
  const { transfers, reviewTransfer } = useTransfers()
  const [reviewTarget, setReviewTarget] = useState<{ transfer: TransferRecord; action: 'APPROVED' | 'REJECTED' } | null>(null)

  const reviewerName = `${user?.firstName ?? 'Coordinator'} ${user?.lastName ?? ''}`.trim()

  const columns: ColumnDef<TransferRecord, unknown>[] = [
    { accessorKey: 'playerName', header: 'Player' },
    { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
    {
      id: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.source ? sourceLabels[row.original.source] : '—'}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={transferStatusVariants[row.original.status]}>{transferStatusLabels[row.original.status]}</Badge>
      ),
    },
    { accessorKey: 'submittedAt', header: 'Submitted' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setReviewTarget({ transfer: row.original, action: 'APPROVED' })}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => setReviewTarget({ transfer: row.original, action: 'REJECTED' })}>Reject</Button>
          </div>
        ) : null,
    },
  ]

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Transfer queue</h1>
            <p className="text-sm text-muted-foreground">Engagement-initiated, player-requested, and manual coordinator transfers.</p>
          </div>
          <Button render={<Link to="/admin/transfers/new" />}><PlusIcon data-icon="inline-start" />Manual entry</Button>
        </div>
        <DataTable columns={columns} data={transfers} searchKey="playerName" searchPlaceholder="Search..." />
      </div>

      <ConfirmDialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => !open && setReviewTarget(null)}
        title={reviewTarget?.action === 'APPROVED' ? `Approve transfer for ${reviewTarget.transfer.playerName}?` : `Reject transfer for ${reviewTarget?.transfer.playerName}?`}
        description={
          reviewTarget
            ? `${reviewTarget.transfer.fromClub} → ${reviewTarget.transfer.toClub}. ${reviewTarget.transfer.reason ?? ''}`
            : ''
        }
        confirmLabel={reviewTarget?.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={reviewTarget?.action === 'REJECTED' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (reviewTarget) reviewTransfer(reviewTarget.transfer.id, reviewTarget.action, reviewerName)
          setReviewTarget(null)
        }}
      />
    </PortalLayout>
  )
}
