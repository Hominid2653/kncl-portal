import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'

import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { engagementStatusLabels, engagementStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { EngagementRequest } from '@/types'

function engagementColumns(
  actions: (row: EngagementRequest) => ReactNode,
): ColumnDef<EngagementRequest, unknown>[] {
  return [
    {
      id: 'player',
      header: 'Player',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.playerName}</p>
          {row.original.playerCurrentClubName && (
            <p className="text-xs text-muted-foreground">{row.original.playerCurrentClubName}</p>
          )}
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
    { accessorKey: 'createdAt', header: 'Date' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => actions(row.original),
    },
  ]
}

export default function ClubEngagementsPage() {
  const { user } = useAuth()
  const { getClubEngagements, getOutgoingEngagements, respondToEngagement, initiateMovementFromEngagement } = useEngagements()
  const [movementTarget, setMovementTarget] = useState<EngagementRequest | null>(null)
  const [respondTarget, setRespondTarget] = useState<{ id: string; status: 'ACCEPTED' | 'DECLINED' } | null>(null)

  const incoming = user?.clubId ? getClubEngagements(user.clubId) : []
  const outgoing = user?.clubId ? getOutgoingEngagements(user.clubId) : []
  const pendingIncoming = incoming.filter((e) => e.status === 'PENDING').length

  const movementLabel = movementTarget?.playerCommitmentStatus === 'FREE_AGENT' ? 'roster enrollment' : 'transfer'

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Engagements</h1>
          <p className="text-sm text-muted-foreground">
            Express interest anytime. Initiate roster enrollment (free agents) or transfer (committed players) when windows allow.
          </p>
        </div>

        {pendingIncoming > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingIncoming} incoming club-to-club request{pendingIncoming > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription>Review interest about your committed players. The player is CC&apos;d for personal terms.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="outgoing">
          <TabsList>
            <TabsTrigger value="outgoing">Your interest ({outgoing.length})</TabsTrigger>
            <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="outgoing">
            <Card>
              <CardHeader>
                <CardTitle>Outgoing interest</CardTitle>
                <CardDescription>
                  Free agents → roster enrollment after acceptance. Committed players → inter-club transfer after selling captain accepts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={engagementColumns((row) =>
                    row.status === 'ACCEPTED' && !row.rosterEnrollmentInitiated && !row.transferInitiated ? (
                      <Button size="sm" onClick={() => setMovementTarget(row)}>
                        {row.playerCommitmentStatus === 'FREE_AGENT' ? 'Initiate enrollment' : 'Initiate transfer'}
                      </Button>
                    ) : row.rosterEnrollmentInitiated ? (
                      <span className="text-xs text-muted-foreground">Enrollment {row.rosterEnrollmentId}</span>
                    ) : row.transferInitiated ? (
                      <span className="text-xs text-muted-foreground">Transfer {row.transferId}</span>
                    ) : null,
                  )}
                  data={outgoing}
                  searchKey="playerName"
                  searchPlaceholder="Search..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming">
            <Card>
              <CardHeader>
                <CardTitle>Incoming interest</CardTitle>
                <CardDescription>Club-to-club negotiations for your committed players.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={engagementColumns((row) =>
                    row.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setRespondTarget({ id: row.id, status: 'ACCEPTED' })}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => setRespondTarget({ id: row.id, status: 'DECLINED' })}>Decline</Button>
                      </div>
                    ) : null,
                  )}
                  data={incoming}
                  searchKey="playerName"
                  searchPlaceholder="Search..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={Boolean(movementTarget)}
        onOpenChange={(open) => !open && setMovementTarget(null)}
        title={`Initiate ${movementLabel} for ${movementTarget?.playerName}?`}
        description={
          movementTarget?.playerCommitmentStatus === 'FREE_AGENT'
            ? 'Creates a roster enrollment request for coordinator approval (first club affiliation).'
            : 'Creates a formal inter-club transfer for league coordinator review.'
        }
        confirmLabel={movementTarget?.playerCommitmentStatus === 'FREE_AGENT' ? 'Initiate enrollment' : 'Initiate transfer'}
        onConfirm={() => {
          if (movementTarget && user) initiateMovementFromEngagement(movementTarget.id, user)
          setMovementTarget(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(respondTarget)}
        onOpenChange={(open) => !open && setRespondTarget(null)}
        title={respondTarget?.status === 'ACCEPTED' ? 'Accept club-to-club engagement?' : 'Decline engagement?'}
        description={
          respondTarget?.status === 'ACCEPTED'
            ? 'Opens the path for the requesting club to initiate a transfer when the window is open. The player remains CC\'d for personal terms.'
            : 'The requesting club will be notified that interest was declined.'
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
