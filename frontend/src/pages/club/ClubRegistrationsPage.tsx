import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { registrations } from '@/data/mockData'
import type { RegistrationRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<RegistrationRecord, unknown>[] = [
  { accessorKey: 'playerName', header: 'Player' },
  { accessorKey: 'season', header: 'Season' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={registrationStatusVariants[row.original.status]}>{registrationStatusLabels[row.original.status]}</Badge> },
  { accessorKey: 'submittedAt', header: 'Submitted' },
]

export default function ClubRegistrationsPage() {
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Registrations</h1></div>
          <Button render={<Link to="/club/registrations/new" />}><PlusIcon data-icon="inline-start" />New registration</Button>
        </div>
        <DataTable columns={columns} data={registrations} searchKey="playerName" searchPlaceholder="Search..." />
      </div>
    </PortalLayout>
  )
}
