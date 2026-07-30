import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { engagementStatusLabels, engagementStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { EngagementRequest } from '@/types'

export default function PlayerEngagementsPage() {
  const { user } = useAuth()
  const { getPlayerEngagements, respondToEngagement } = useEngagements()
  const [respondTarget, setRespondTarget] = useState<{ id: string; status: 'ACCEPTED' | 'DECLINED'; clubName: string } | null>(null)

  const engagements = user?.playerId ? getPlayerEngagements(user.playerId) : []
  const pendingCount = engagements.filter((e) => e.status === 'PENDING').length

  const columns: ColumnDef<EngagementRequest, unknown>[] = [
    {
      id: 'club',
      header: 'Interested club',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.requestingClubName}</p>
          <p className="text-xs text-muted-foreground">Captain: {row.original.requestingCaptainName}</p>
        </div>
      ),
    },
    { accessorKey: 'message', header: 'Message' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={engagementStatusVariants[row.original.status]}>
          {engagementStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    { accessorKey: 'createdAt', header: 'Received' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setRespondTarget({ id: row.original.id, status: 'ACCEPTED', clubName: row.original.requestingClubName })}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRespondTarget({ id: row.original.id, status: 'DECLINED', clubName: row.original.requestingClubName })}
            >
              Decline
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Engagements</h1>
          <p className="text-sm text-muted-foreground">
            Clubs interested in signing you as a free agent. Accept to let the captain initiate a transfer.
          </p>
        </div>

        {pendingCount > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription>Review club interest and respond to begin discussions.</AlertDescription>
          </Alert>
        )}

        {!user?.playerId ? (
          <Alert variant="destructive">
            <AlertTitle>Profile not linked</AlertTitle>
            <AlertDescription>Your account is not linked to a player profile yet.</AlertDescription>
          </Alert>
        ) : (
          <DataTable columns={columns} data={engagements} searchKey="requestingClubName" searchPlaceholder="Search by club..." />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(respondTarget)}
        onOpenChange={(open) => !open && setRespondTarget(null)}
        title={respondTarget?.status === 'ACCEPTED' ? `Accept interest from ${respondTarget.clubName}?` : `Decline interest from ${respondTarget?.clubName}?`}
        description={
          respondTarget?.status === 'ACCEPTED'
            ? 'The club captain can then initiate a formal transfer request.'
            : 'The club will be notified that you declined their interest.'
        }
        confirmLabel={respondTarget?.status === 'ACCEPTED' ? 'Accept' : 'Decline'}
        variant={respondTarget?.status === 'DECLINED' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (respondTarget) respondToEngagement(respondTarget.id, respondTarget.status)
          setRespondTarget(null)
        }}
      />
    </PortalLayout>
  )
}
