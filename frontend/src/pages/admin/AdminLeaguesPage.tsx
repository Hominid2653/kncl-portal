import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { leagues } from '@/data/mockData'
import type { LeagueRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

export default function AdminLeaguesPage() {
  const [open, setOpen] = useState(false)
  const columns: ColumnDef<LeagueRecord, unknown>[] = [
    { accessorKey: 'name', header: 'League' },
    { accessorKey: 'description', header: 'Description' },
  ]
  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex justify-between"><h1 className="text-2xl font-semibold">Leagues</h1><Button onClick={() => setOpen(true)}><PlusIcon data-icon="inline-start" />Add league</Button></div>
        <DataTable columns={columns} data={leagues} searchKey="name" searchPlaceholder="Search..." />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add league</DialogTitle></DialogHeader>
            <div className="space-y-2"><Label>Name</Label><Input /></div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { toast.success('League created (mock)'); setOpen(false) }}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
