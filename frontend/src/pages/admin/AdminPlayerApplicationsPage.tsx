import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ApplicationRejectDialog from '@/components/application-reject-dialog'
import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { PlayerRegistrationApplication } from '@/types'

export default function AdminPlayerApplicationsPage() {
  const { user } = useAuth()
  const { getScopedPlayerApplications, getScopedPendingCounts, reviewPlayerApplication, applicationsLoading } = useOnboarding()
  const [rejectTarget, setRejectTarget] = useState<PlayerRegistrationApplication | null>(null)
  const [approveTarget, setApproveTarget] = useState<PlayerRegistrationApplication | null>(null)

  const applications = getScopedPlayerApplications(user)
  const pendingCount = getScopedPendingCounts(user).player

  const columns: ColumnDef<PlayerRegistrationApplication, unknown>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Player',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: 'leagueName', header: 'League' },
      { accessorKey: 'county', header: 'County' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={registrationStatusVariants[row.original.status]}>
            {registrationStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'rejection',
        header: 'Rejection message',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.rejectionReason ?? '—'}</span>
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
            <span className="text-xs text-muted-foreground">{row.original.reviewedBy ?? '—'}</span>
          ),
      },
    ],
    [reviewPlayerApplication, user],
  )

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Player profile applications</h1>
          <p className="text-sm text-muted-foreground">
            Every new player registration requires coordinator approval. Rejections must include a message for the applicant.
          </p>
        </div>

        {user?.role === 'LEAGUE_COORDINATOR' && (
          <Alert>
            <AlertTitle>League scope</AlertTitle>
            <AlertDescription>
              Club applications are filtered to your leagues. Player profile requests are federation-wide and visible to all coordinators.
            </AlertDescription>
          </Alert>
        )}

        {pendingCount > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingCount} pending profile{pendingCount > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription>Approved players are created as free agents with a federation ID.</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={applications}
          loading={applicationsLoading}
          searchKey="email"
          searchPlaceholder="Search by email..."
        />
      </div>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={`Approve ${approveTarget?.firstName} ${approveTarget?.lastName}?`}
        description="This creates a free agent profile, assigns a federation ID, and provisions a portal login for the applicant's email."
        confirmLabel="Approve player"
        onConfirm={() => {
          if (!approveTarget) return
          reviewPlayerApplication({
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
        title={`Reject ${rejectTarget?.firstName} ${rejectTarget?.lastName}`}
        description="Provide a clear reason. The applicant will see this message."
        onConfirm={(reason) => {
          if (!rejectTarget) return
          reviewPlayerApplication({
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
