import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/context/PortalDataContext'
import type { PlayerRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<PlayerRecord, unknown>[] = [
  { accessorKey: 'name', header: 'Player' },
  { accessorKey: 'federationId', header: 'Federation ID' },
  { accessorKey: 'fideRating', header: 'Rating' },
  { id: 'lichess', header: 'Lichess', cell: ({ row }) => <Badge variant={row.original.lichessVerified ? 'secondary' : 'outline'}>{row.original.lichessVerified ? 'Verified' : 'Unverified'}</Badge> },
]

export default function ClubPlayersPage() {
  const { players } = usePortalData()
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Players</h1><p className="text-sm text-muted-foreground">Players on your roster. New members are added from free agents during transfer windows.</p></div>
          <Button render={<Link to="/club/players/new" />}><PlusIcon data-icon="inline-start" />Add free agent</Button>
        </div>
        <DataTable columns={columns} data={players.filter((p) => p.club === 'Nairobi Kings')} searchKey="name" searchPlaceholder="Search players..." />
      </div>
    </PortalLayout>
  )
}
