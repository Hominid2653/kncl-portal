import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table'
import { auditLogs } from '@/data/mockData'
import type { AuditLogRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<AuditLogRecord, unknown>[] = [
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entity', header: 'Entity' },
  { accessorKey: 'actor', header: 'Actor' },
  { accessorKey: 'createdAt', header: 'When' },
]

export default function AdminAuditLogsPage() {
  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Audit logs</h1><p className="text-sm text-muted-foreground">Read-only federation activity log.</p></div>
        <DataTable columns={columns} data={auditLogs} searchKey="action" searchPlaceholder="Search actions..." />
      </div>
    </PortalLayout>
  )
}
