import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { PageHeaderSkeleton } from '@/components/skeletons/page-skeletons'
import { usePortalData, usePortalListLoading } from '@/context/PortalDataContext'
import type { ClubRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<ClubRecord, unknown>[] = [
  { accessorKey: 'name', header: 'Club' },
  { accessorKey: 'league', header: 'League' },
  { accessorKey: 'county', header: 'County' },
  { accessorKey: 'players', header: 'Players' },
]

export default function AdminClubsPage() {
  const { clubs } = usePortalData()
  const listLoading = usePortalListLoading(clubs.length)

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        {listLoading ? (
          <PageHeaderSkeleton withDescription={false} />
        ) : (
          <div><h1 className="text-2xl font-semibold">Clubs</h1></div>
        )}
        <DataTable
          columns={columns}
          data={clubs}
          searchKey="name"
          searchPlaceholder="Search clubs..."
          loading={listLoading}
        />
      </div>
    </PortalLayout>
  )
}
