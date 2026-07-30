import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { registrations } from '@/data/mockData'
import type { RegistrationRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<RegistrationRecord, unknown>[] = [
  { accessorKey: 'season', header: 'Season' },
  { accessorKey: 'club', header: 'Club' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={registrationStatusVariants[row.original.status]}>{registrationStatusLabels[row.original.status]}</Badge> },
  { accessorKey: 'submittedAt', header: 'Submitted' },
]

export default function PlayerRegistrationsPage() {
  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">My registrations</h1><p className="text-sm text-muted-foreground">Season registrations for your player record.</p></div>
        <DataTable columns={columns} data={registrations} searchKey="season" searchPlaceholder="Search seasons..." />
      </div>
    </PortalLayout>
  )
}
