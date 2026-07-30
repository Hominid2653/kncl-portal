import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { engagementStatusLabels, engagementStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { EngagementRequest } from '@/types'

export default function PlayerEngagementsPage() {
  const { user } = useAuth()
  const { getPlayerEngagements, getPlayerCcEngagements, respondToEngagement } = useEngagements()
  const [respondTarget, setRespondTarget] = useState<{ id: string; status: 'ACCEPTED' | 'DECLINED'; clubName: string } | null>(null)

  const directEngagements = user?.playerId ? getPlayerEngagements(user.playerId) : []
  const ccEngagements = user?.playerId ? getPlayerCcEngagements(user.playerId) : []
  const pendingCount = directEngagements.filter((e) => e.status === 'PENDING').length

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
        row.original.status === 'PENDING' && row.original.recipientType === 'PLAYER' ? (
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
            Free-agent interest requires your response. Committed-player moves are captain-to-captain — you are CC&apos;d for personal terms.
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
          <>
            <DataTable columns={columns} data={directEngagements} searchKey="requestingClubName" searchPlaceholder="Search by club..." />

            {ccEngagements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>CC&apos;d — club negotiations</CardTitle>
                  <CardDescription>
                    Your current club captain handles club-to-club terms. You are copied for visibility on personal terms only.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={columns.filter((c) => c.id !== 'actions')}
                    data={ccEngagements}
                    searchKey="requestingClubName"
                    searchPlaceholder="Search..."
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(respondTarget)}
        onOpenChange={(open) => !open && setRespondTarget(null)}
        title={respondTarget?.status === 'ACCEPTED' ? `Accept interest from ${respondTarget.clubName}?` : `Decline interest from ${respondTarget?.clubName}?`}
        description={
          respondTarget?.status === 'ACCEPTED'
            ? 'The club captain can initiate roster enrollment when the enrollment/transfer window allows.'
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
