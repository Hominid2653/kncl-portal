import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import ConfirmDialog from '@/components/confirm-dialog'
import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSeason } from '@/context/SeasonContext'
import PortalLayout from '@/layouts/PortalLayout'
import type { SeasonRecord } from '@/types'

export default function AdminSeasonsPage() {
  const { seasons, toggleRegistration, toggleTransfers } = useSeason()
  const [windowConfirm, setWindowConfirm] = useState<{
    seasonId: string
    seasonName: string
    type: 'registration' | 'transfers'
    open: boolean
  } | null>(null)

  const columns: ColumnDef<SeasonRecord, unknown>[] = [
    { accessorKey: 'name', header: 'Season' },
    { accessorKey: 'leagueName', header: 'League' },
    { accessorKey: 'year', header: 'Year' },
    {
      id: 'reg',
      header: 'Registration window',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.original.registrationOpen ? 'secondary' : 'outline'}>
            {row.original.registrationOpen ? 'Open' : 'Closed'}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setWindowConfirm({
            seasonId: row.original.id,
            seasonName: row.original.name,
            type: 'registration',
            open: !row.original.registrationOpen,
          })}>
            {row.original.registrationOpen ? 'Close' : 'Open'}
          </Button>
        </div>
      ),
    },
    {
      id: 'tr',
      header: 'Transfer window',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.original.transfersOpen ? 'secondary' : 'outline'}>
            {row.original.transfersOpen ? 'Open' : 'Closed'}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setWindowConfirm({
            seasonId: row.original.id,
            seasonName: row.original.name,
            type: 'transfers',
            open: !row.original.transfersOpen,
          })}>
            {row.original.transfersOpen ? 'Close' : 'Open'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Seasons &amp; windows</h1>
          <p className="text-sm text-muted-foreground">
            Windows are per league. KNCL and KWCL can have different transfer schedules.
          </p>
        </div>

        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Per-league control</AlertTitle>
          <AlertDescription>
            Closing KWCL transfers does not affect KNCL. New clubs in initial roster period can still build squads when their league window is closed.
          </AlertDescription>
        </Alert>

        <DataTable columns={columns} data={seasons} searchKey="name" searchPlaceholder="Search seasons..." />
      </div>

      <ConfirmDialog
        open={Boolean(windowConfirm)}
        onOpenChange={(open) => !open && setWindowConfirm(null)}
        title={windowConfirm?.open ? 'Open window?' : 'Close window?'}
        description={
          windowConfirm
            ? `${windowConfirm.open ? 'Open' : 'Close'} the ${windowConfirm.type} window for ${windowConfirm.seasonName}. This affects roster eligibility for that league.`
            : ''
        }
        confirmLabel={windowConfirm?.open ? 'Open' : 'Close'}
        variant={windowConfirm?.open ? 'default' : 'destructive'}
        onConfirm={() => {
          if (!windowConfirm) return
          if (windowConfirm.type === 'registration') {
            toggleRegistration(windowConfirm.seasonId, windowConfirm.open)
          } else {
            toggleTransfers(windowConfirm.seasonId, windowConfirm.open)
          }
          setWindowConfirm(null)
        }}
      />
    </PortalLayout>
  )
}
