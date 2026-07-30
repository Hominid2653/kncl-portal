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
import type { ClubCaptainApplication } from '@/types'

export default function AdminClubApplicationsPage() {
  const { user } = useAuth()
  const { getScopedClubApplications, getScopedPendingCounts, reviewClubApplication, applicationsLoading } = useOnboarding()
  const [rejectTarget, setRejectTarget] = useState<ClubCaptainApplication | null>(null)
  const [approveTarget, setApproveTarget] = useState<ClubCaptainApplication | null>(null)

  const applications = getScopedClubApplications(user)
  const pendingCount = getScopedPendingCounts(user).club

  const columns: ColumnDef<ClubCaptainApplication, unknown>[] = useMemo(
    () => [
      {
        id: 'club',
        header: 'Club',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.clubName}</p>
            <p className="text-xs text-muted-foreground">{row.original.county} · {row.original.leagueName}</p>
          </div>
        ),
      },
      {
        id: 'captain',
        header: 'Captain',
        cell: ({ row }) => (
          <div>
            <p>{row.original.captainFirstName} {row.original.captainLastName}</p>
            <p className="text-xs text-muted-foreground">{row.original.captainEmail}</p>
          </div>
        ),
      },
      {
        id: 'charter',
        header: 'Charter',
        cell: ({ row }) =>
          row.original.charterFileName ? (
            <span className="text-sm text-kenya-green">{row.original.charterFileName}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Not provided</span>
          ),
      },
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
    [reviewClubApplication, user],
  )

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Club &amp; captain applications</h1>
          <p className="text-sm text-muted-foreground">
            Review new teams with optional charter documents. Approved clubs receive an initial roster period.
          </p>
        </div>

        {user?.role === 'LEAGUE_COORDINATOR' && (
          <Alert>
            <AlertTitle>League scope</AlertTitle>
            <AlertDescription>Showing applications for your assigned leagues only (KWCL applications hidden for KNCL coordinators).</AlertDescription>
          </Alert>
        )}

        {pendingCount > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingCount} pending application{pendingCount > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription>Approve club and captain together. Initial roster period allows roster building outside transfer windows.</AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={applications}
          loading={applicationsLoading}
          searchKey="clubName"
          searchPlaceholder="Search clubs..."
        />
      </div>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={`Approve ${approveTarget?.clubName}?`}
        description="This creates the club, enables initial roster period, and provisions a captain login for the applicant."
        confirmLabel="Approve club"
        onConfirm={() => {
          if (!approveTarget) return
          reviewClubApplication({
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
        title={`Reject ${rejectTarget?.clubName}`}
        description="Provide a clear reason for the captain applicant."
        onConfirm={(reason) => {
          if (!rejectTarget) return
          reviewClubApplication({
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
