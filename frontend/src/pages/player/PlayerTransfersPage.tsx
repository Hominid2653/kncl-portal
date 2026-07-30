import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { PlusIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useSeason } from '@/context/SeasonContext'
import { useTransfers } from '@/context/TransferContext'
import { canPlayerSubmitTransferRequest } from '@/lib/business-rules'
import { getClubLeagueId } from '@/lib/coordinator'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const sourceLabels: Record<NonNullable<TransferRecord['source']>, string> = {
  ENGAGEMENT: 'From engagement',
  PLAYER_REQUEST: 'Your request',
  COORDINATOR_MANUAL: 'Coordinator',
}

export default function PlayerTransfersPage() {
  const { user } = useAuth()
  const { getTransfersForPlayer, getPendingTransferForPlayer } = useTransfers()
  const { isTransferWindowOpen } = useSeason()

  const transfers = user?.playerId ? getTransfersForPlayer(user.playerId) : []
  const pending = user?.playerId ? getPendingTransferForPlayer(user.playerId) : undefined
  const leagueId = getClubLeagueId(user?.clubId)
  const canRequest = canPlayerSubmitTransferRequest(isTransferWindowOpen(leagueId), Boolean(user?.clubId))

  const columns: ColumnDef<TransferRecord, unknown>[] = [
    { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
    {
      id: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.source ? sourceLabels[row.original.source] : '—'}
        </span>
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
    { accessorKey: 'reason', header: 'Reason' },
  ]

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My transfers</h1>
            <p className="text-sm text-muted-foreground">
              Submit transfer requests during open windows. Club-to-club terms are handled by captains; you provide personal terms here.
            </p>
          </div>
          <Button render={<Link to="/player/transfers/new" />} disabled={!canRequest || Boolean(pending)}>
            <PlusIcon data-icon="inline-start" />
            Request transfer
          </Button>
        </div>

        {!user?.clubId && (
          <p className="text-sm text-muted-foreground">
            Free agents cannot request transfers. Join a club via roster enrollment first.
          </p>
        )}

        {pending && (
          <p className="text-sm text-muted-foreground">
            Pending request <strong>{pending.id}</strong> to {pending.toClub} — wait for coordinator review before submitting another.
          </p>
        )}

        <DataTable columns={columns} data={transfers} searchKey="toClub" searchPlaceholder="Search..." />
      </div>
    </PortalLayout>
  )
}
