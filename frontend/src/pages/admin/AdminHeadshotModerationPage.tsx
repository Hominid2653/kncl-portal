import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ApplicationRejectDialog from '@/components/application-reject-dialog'
import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { initials, usePlayerListings } from '@/context/PlayerListingsContext'
import { useAuth } from '@/context/AuthContext'
import { filterByLeagueScope } from '@/lib/coordinator'
import PortalLayout from '@/layouts/PortalLayout'
import type { HeadshotModerationRequest } from '@/types'

export default function AdminHeadshotModerationPage() {
  const { user } = useAuth()
  const { headshotModerations, reviewHeadshot, pendingHeadshotCount } = usePlayerListings()
  const [rejectTarget, setRejectTarget] = useState<HeadshotModerationRequest | null>(null)
  const [approveTarget, setApproveTarget] = useState<HeadshotModerationRequest | null>(null)

  const scoped = filterByLeagueScope(user, headshotModerations)

  const columns: ColumnDef<HeadshotModerationRequest, unknown>[] = useMemo(
    () => [
      {
        id: 'preview',
        header: 'Preview',
        cell: ({ row }) => (
          <Avatar className="size-12">
            <AvatarImage src={row.original.proposedUrl} alt={row.original.playerName} />
            <AvatarFallback>{initials(row.original.playerName)}</AvatarFallback>
          </Avatar>
        ),
      },
      { accessorKey: 'playerName', header: 'Player' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={registrationStatusVariants[row.original.status]}>
            {registrationStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      { accessorKey: 'submittedAt', header: 'Submitted' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          row.original.status === 'PENDING' ? (
            <div className="flex gap-2">
            <Button size="sm" onClick={() => setApproveTarget(row.original)}>
              Approve
            </Button>
              <Button size="sm" variant="outline" onClick={() => setRejectTarget(row.original)}>
                Reject
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{row.original.rejectionReason ?? row.original.reviewedBy ?? '—'}</span>
          ),
      },
    ],
    [reviewHeadshot, user],
  )

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Headshot moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review player profile photos before they appear on public listings.
          </p>
        </div>

        {pendingHeadshotCount > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingHeadshotCount} headshot{pendingHeadshotCount > 1 ? 's' : ''} awaiting review</AlertTitle>
            <AlertDescription>Rejected uploads include a message visible to the player.</AlertDescription>
          </Alert>
        )}

        <DataTable columns={columns} data={scoped} searchKey="playerName" searchPlaceholder="Search players..." />
      </div>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={`Publish headshot for ${approveTarget?.playerName}?`}
        description="This photo will appear on the public player listings grid."
        confirmLabel="Approve headshot"
        onConfirm={() => {
          if (!approveTarget) return
          reviewHeadshot({
            id: approveTarget.id,
            status: 'APPROVED',
            reviewerName: `${user?.firstName} ${user?.lastName}`,
          })
          setApproveTarget(null)
        }}
      />

      <ApplicationRejectDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title={`Reject headshot for ${rejectTarget?.playerName}`}
        description="Tell the player why the photo cannot be used."
        onConfirm={(reason) => {
          if (!rejectTarget) return
          reviewHeadshot({
            id: rejectTarget.id,
            status: 'REJECTED',
            reviewerName: `${user?.firstName} ${user?.lastName}`,
            rejectionReason: reason,
          })
          setRejectTarget(null)
        }}
      />
    </PortalLayout>
  )
}
