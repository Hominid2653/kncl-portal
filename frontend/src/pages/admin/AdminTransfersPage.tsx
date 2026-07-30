import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { transfers } from '@/data/mockData'
import type { TransferRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

export default function AdminTransfersPage() {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')

  const columns: ColumnDef<TransferRecord, unknown>[] = [
    { accessorKey: 'playerName', header: 'Player' },
    { id: 'route', header: 'Route', cell: ({ row }) => `${row.original.fromClub} → ${row.original.toClub}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={transferStatusVariants[row.original.status]}>{transferStatusLabels[row.original.status]}</Badge> },
    { id: 'actions', header: '', cell: () => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setAction('approve'); setOpen(true) }}>Approve</Button>
        <Button size="sm" variant="destructive" onClick={() => { setAction('reject'); setOpen(true) }}>Reject</Button>
      </div>
    )},
  ]

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Transfer queue</h1></div>
        <DataTable columns={columns} data={transfers} searchKey="playerName" searchPlaceholder="Search..." />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{action === 'approve' ? 'Approve transfer' : 'Reject transfer'}</DialogTitle>
              <DialogDescription>Approving updates the player&apos;s club affiliation.</DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Optional remarks" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant={action === 'reject' ? 'destructive' : 'default'} onClick={() => { toast.success(`Transfer ${action}d (mock)`); setOpen(false) }}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
