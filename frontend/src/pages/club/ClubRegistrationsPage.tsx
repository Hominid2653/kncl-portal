import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { rosterEnrollmentStatusLabels, rosterEnrollmentStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useRosterEnrollments } from '@/context/RosterEnrollmentContext'
import type { RosterEnrollmentRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

export default function ClubRegistrationsPage() {
  const { user } = useAuth()
  const { rosterEnrollments } = useRosterEnrollments()

  const clubEnrollments = rosterEnrollments.filter((e) => e.clubId === user?.clubId)

  const columns: ColumnDef<RosterEnrollmentRecord, unknown>[] = [
    { accessorKey: 'playerName', header: 'Player' },
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
    { accessorKey: 'submittedAt', header: 'Submitted' },
  ]

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Roster enrollments</h1>
          <p className="text-sm text-muted-foreground">
            First club affiliations for free agents you engaged. New enrollments start from accepted engagements.
          </p>
        </div>

        <Alert>
          <AlertTitle>Engagement-first workflow</AlertTitle>
          <AlertDescription>
            To add a free agent, use <Link to="/club/players/new" className="underline">Add free agent</Link> or{' '}
            <Link to="/club/engagements" className="underline">Engagements</Link> — not a manual form here.
          </AlertDescription>
        </Alert>

        <DataTable columns={columns} data={clubEnrollments} searchKey="playerName" searchPlaceholder="Search..." />
        <Button variant="outline" render={<Link to="/club/engagements" />}>View engagements</Button>
      </div>
    </PortalLayout>
  )
}
