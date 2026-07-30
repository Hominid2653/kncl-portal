import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { players } from '@/data/mockData'
import type { PlayerRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<PlayerRecord, unknown>[] = [
  { accessorKey: 'name', header: 'Player' },
  { accessorKey: 'club', header: 'Club' },
  { accessorKey: 'fideRating', header: 'Rating' },
  { id: 'v', header: 'Verified', cell: ({ row }) => <Badge variant={row.original.lichessVerified ? 'secondary' : 'outline'}>{row.original.lichessVerified ? 'Yes' : 'No'}</Badge> },
]

export default function AdminPlayersPage() {
  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Players</h1></div>
        <DataTable columns={columns} data={players} searchKey="name" searchPlaceholder="Search players..." />
      </div>
    </PortalLayout>
  )
}
