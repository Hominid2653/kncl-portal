import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { PageHeaderSkeleton } from '@/components/skeletons/page-skeletons'
import { usePortalData, usePortalListLoading } from '@/context/PortalDataContext'
import type { AuditLogRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<AuditLogRecord, unknown>[] = [
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entity', header: 'Entity' },
  { accessorKey: 'actor', header: 'Actor' },
  { accessorKey: 'createdAt', header: 'When' },
]

export default function AdminAuditLogsPage() {
  const { auditLogs } = usePortalData()
  const listLoading = usePortalListLoading(auditLogs.length)

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        {listLoading ? (
          <PageHeaderSkeleton withDescription={false} />
        ) : (
          <div><h1 className="text-2xl font-semibold">Audit logs</h1></div>
        )}
        <DataTable
          columns={columns}
          data={auditLogs}
          searchKey="action"
          searchPlaceholder="Search logs..."
          loading={listLoading}
        />
      </div>
    </PortalLayout>
  )
}
