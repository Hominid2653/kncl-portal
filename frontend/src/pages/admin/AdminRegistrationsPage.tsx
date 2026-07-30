import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { registrations } from '@/data/mockData'
import type { RegistrationRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

export default function AdminRegistrationsPage() {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')

  const columns: ColumnDef<RegistrationRecord, unknown>[] = [
    { accessorKey: 'playerName', header: 'Player' },
    { accessorKey: 'club', header: 'Club' },
    { accessorKey: 'season', header: 'Season' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={registrationStatusVariants[row.original.status]}>{registrationStatusLabels[row.original.status]}</Badge> },
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
        <div><h1 className="text-2xl font-semibold">Registration queue</h1><p className="text-sm text-muted-foreground">Review and action pending registrations.</p></div>
        <DataTable columns={columns} data={registrations} searchKey="playerName" searchPlaceholder="Search..." />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{action === 'approve' ? 'Approve registration' : 'Reject registration'}</DialogTitle>
              <DialogDescription>Approving will notify the player and update their eligibility.</DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Optional remarks" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant={action === 'reject' ? 'destructive' : 'default'} onClick={() => { toast.success(`Registration ${action}d (mock)`); setOpen(false) }}>
                {action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
