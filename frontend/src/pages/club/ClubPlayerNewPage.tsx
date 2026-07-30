import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useSeason } from '@/context/SeasonContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { usePortalData } from '@/context/PortalDataContext'
import { getClubLeagueId } from '@/lib/coordinator'
import PortalLayout from '@/layouts/PortalLayout'
import type { PlayerListingRecord } from '@/types'

export default function ClubPlayerNewPage() {
  const { user } = useAuth()
  const { clubs } = usePortalData()
  const { createEngagement } = useEngagements()
  const [selected, setSelected] = useState<PlayerListingRecord | null>(null)
  const [message, setMessage] = useState('')
  const { freeAgents } = usePlayerListings()
  const { isClubInInitialRosterPeriod } = useOnboarding()
  const { canModifyRoster, getSeasonForLeague } = useSeason()

  const club = clubs.find((c) => c.id === user?.clubId)
  const leagueId = club?.leagueId ?? getClubLeagueId(user?.clubId)
  const season = getSeasonForLeague(leagueId)
  const inInitialPeriod = user?.clubId ? isClubInInitialRosterPeriod(user.clubId) : false
  const canAdd = canModifyRoster(leagueId, inInitialPeriod)

  const columns = useMemo<ColumnDef<PlayerListingRecord, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Player' },
      { accessorKey: 'federationId', header: 'Federation ID' },
      { accessorKey: 'county', header: 'County' },
      { accessorKey: 'fideRating', header: 'Rating' },
      {
        id: 'status',
        header: 'Status',
        cell: () => <Badge className="border-kenya-green/30 bg-kenya-green/10 text-kenya-green">Free agent</Badge>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={!canAdd}
            onClick={() => {
              setSelected(row.original)
              setMessage('')
            }}
          >
            Express interest
          </Button>
        ),
      },
    ],
    [canAdd],
  )

  const handleSubmit = () => {
    if (!selected || !user) return
    if (!message.trim()) {
      toast.error('Add a message to start discussions.')
      return
    }
    createEngagement({ player: selected, captain: user, message: message.trim() })
    setSelected(null)
    setMessage('')
  }

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Add free agent to roster</h1>
          <p className="text-sm text-muted-foreground">
            Roster changes use existing free agents only. Express interest to begin the engagement and transfer process.
          </p>
        </div>

        {!canAdd ? (
          <Alert variant="destructive">
            <AlertTitle>Roster changes locked</AlertTitle>
            <AlertDescription>
              Transfer window is closed for {season?.leagueName}. New clubs in initial roster period can still add players after coordinator approval.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{inInitialPeriod ? 'Initial roster period' : `Transfer window open — ${season?.name}`}</AlertTitle>
            <AlertDescription>
              Select a registered free agent and express interest to begin the transfer workflow.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available free agents</CardTitle>
            <CardDescription>Players must already exist in the federation database. Captains cannot create new player records.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={freeAgents} searchKey="name" searchPlaceholder="Search free agents..." />
          </CardContent>
        </Card>

        <Button variant="outline" render={<Link to="/club/roster" />}>Back to roster</Button>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Express interest in {selected?.name}</DialogTitle>
            <DialogDescription>
              The player receives your request in their portal. After acceptance, submit a formal transfer during this window.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="roster-message">Message</Label>
            <Textarea
              id="roster-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your club and roster position..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSubmit}>Send interest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  )
}
