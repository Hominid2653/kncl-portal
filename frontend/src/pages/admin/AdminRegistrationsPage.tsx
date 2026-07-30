import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ApplicationRejectDialog from '@/components/application-reject-dialog'
import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { rosterEnrollmentStatusLabels, rosterEnrollmentStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useRosterEnrollments } from '@/context/RosterEnrollmentContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { RosterEnrollmentRecord } from '@/types'

export default function AdminRegistrationsPage() {
  const { user } = useAuth()
  const { rosterEnrollments, approveEnrollment, rejectEnrollment } = useRosterEnrollments()
  const [approveTarget, setApproveTarget] = useState<RosterEnrollmentRecord | null>(null)
  const [rejectTarget, setRejectTarget] = useState<RosterEnrollmentRecord | null>(null)

  const columns: ColumnDef<RosterEnrollmentRecord, unknown>[] = [
    { accessorKey: 'playerName', header: 'Player' },
    { accessorKey: 'club', header: 'Club' },
    { accessorKey: 'season', header: 'Season' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={rosterEnrollmentStatusVariants[row.original.status]}>
          {rosterEnrollmentStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setApproveTarget(row.original)}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectTarget(row.original)}>Reject</Button>
          </div>
        ) : null,
    },
  ]

  const reviewerName = `${user?.firstName ?? 'Coordinator'} ${user?.lastName ?? ''}`.trim()

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Roster enrollment queue</h1>
          <p className="text-sm text-muted-foreground">
            First club affiliations for free agents (not inter-club transfers). Approving adds the player to the club roster.
          </p>
        </div>
        <DataTable columns={columns} data={rosterEnrollments} searchKey="playerName" searchPlaceholder="Search..." />
      </div>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={`Approve enrollment for ${approveTarget?.playerName}?`}
        description={`Adds ${approveTarget?.playerName} to ${approveTarget?.club} for ${approveTarget?.season}.`}
        confirmLabel="Approve enrollment"
        onConfirm={() => {
          if (approveTarget) approveEnrollment(approveTarget.id, reviewerName)
          setApproveTarget(null)
        }}
      />

      <ApplicationRejectDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title={`Reject enrollment for ${rejectTarget?.playerName}`}
        description="Provide a reason for the captain and player."
        onConfirm={(reason) => {
          if (rejectTarget) rejectEnrollment(rejectTarget.id, reviewerName, reason)
          setRejectTarget(null)
        }}
      />
    </PortalLayout>
  )
}
