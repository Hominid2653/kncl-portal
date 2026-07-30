import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { HandshakeIcon, LayoutGridIcon, SearchIcon, TableIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import PlayerRatingsBadges from '@/components/player-ratings'
import MarketingPageShell from '@/components/marketing/MarketingPageShell'
import PlayerListingGrid from '@/components/player-listing-grid'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { initials, usePlayerListings } from '@/context/PlayerListingsContext'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import type { PlayerListingRecord } from '@/types'

type ViewMode = 'grid' | 'table'

function commitmentBadge(status: PlayerListingRecord['commitmentStatus']) {
  if (status === 'FREE_AGENT') {
    return <Badge className="border-kenya-green/30 bg-kenya-green/10 text-kenya-green">Free agent</Badge>
  }
  return <Badge variant="secondary">Committed</Badge>
}

export default function PlayerListingsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { createEngagement } = useEngagements()
  const { freeAgents, committed, getHeadshotUrl } = usePlayerListings()
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerListingRecord | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const filterList = (list: PlayerListingRecord[]) =>
    list.filter((p) =>
      [p.name, p.federationId, p.county, p.club ?? ''].join(' ').toLowerCase().includes(search.toLowerCase()),
    )

  const handleExpressInterest = () => {
    if (!selectedPlayer) return

    if (!isAuthenticated || user?.role !== 'CLUB_ADMIN') {
      toast.info('Sign in as a club captain to express interest.')
      navigate('/login', { state: { from: '/players' } })
      return
    }

    if (!message.trim()) {
      toast.error('Please add a short message to start the discussion.')
      return
    }

    createEngagement({ player: selectedPlayer, captain: user, message: message.trim() })
    setSelectedPlayer(null)
    setMessage('')
  }

  const openInterestDialog = (player: PlayerListingRecord) => {
    setSelectedPlayer(player)
    setMessage('')
  }

  const columns: ColumnDef<PlayerListingRecord, unknown>[] = useMemo(
    () => [
      {
        id: 'player',
        header: 'Player',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={getHeadshotUrl(row.original)} alt={row.original.name} />
              <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              {row.original.title && <p className="text-xs text-muted-foreground">{row.original.title}</p>}
            </div>
          </div>
        ),
      },
      { accessorKey: 'federationId', header: 'Federation ID' },
      { accessorKey: 'county', header: 'County' },
      {
        id: 'ratings',
        header: 'Ratings',
        cell: ({ row }) => (
          <PlayerRatingsBadges
            ratings={{
              classicalRating: row.original.classicalRating ?? row.original.fideRating,
              rapidRating: row.original.rapidRating,
              blitzRating: row.original.blitzRating,
              fideId: row.original.fideId,
            }}
            size="sm"
          />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="space-y-1">
            {commitmentBadge(row.original.commitmentStatus)}
            {row.original.club && <p className="text-xs text-muted-foreground">{row.original.club}</p>}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => openInterestDialog(row.original)}>
            <HandshakeIcon className="size-4" data-icon="inline-start" />
            Express interest
          </Button>
        ),
      },
    ],
    [getHeadshotUrl],
  )

  const filteredFreeAgents = filterList(freeAgents)
  const filteredCommitted = filterList(committed)

  return (
    <MarketingPageShell
      eyebrow="Player marketplace"
      title="Player listings"
      description="Browse free agents and committed players. Grid view shows player headshots from their portal profiles."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, county, or federation ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGridIcon className="size-4" data-icon="inline-start" />
            Grid
          </Button>
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
            <TableIcon className="size-4" data-icon="inline-start" />
            Table
          </Button>
        </div>
      </div>

      <Alert className="border-l-4 border-l-kenya-green bg-kenya-green/5">
        <AlertTitle>How engagement works</AlertTitle>
        <AlertDescription>
          Free agents receive your interest directly in their player portal. For committed players, the request is sent to their current club captain.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="free-agents">
        <TabsList>
          <TabsTrigger value="free-agents">Free agents ({filteredFreeAgents.length})</TabsTrigger>
          <TabsTrigger value="committed">Committed to clubs ({filteredCommitted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="free-agents" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Available players</CardTitle>
              <CardDescription>Players not currently committed to any KNCL club.</CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'grid' ? (
                <PlayerListingGrid players={filteredFreeAgents} onExpressInterest={openInterestDialog} />
              ) : (
                <DataTable columns={columns} data={filteredFreeAgents} searchKey="name" searchPlaceholder="Filter table..." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="committed" className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Committed players</CardTitle>
              <CardDescription>Players affiliated with a club. Interest is routed to their club captain.</CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'grid' ? (
                <PlayerListingGrid players={filteredCommitted} onExpressInterest={openInterestDialog} />
              ) : (
                <DataTable columns={columns} data={filteredCommitted} searchKey="name" searchPlaceholder="Filter table..." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!isAuthenticated && (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Club captain?</p>
              <p className="text-sm text-muted-foreground">Sign in to express interest and track engagement requests.</p>
            </div>
            <Button render={<Link to="/login" />}>Sign in as captain</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selectedPlayer)} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Express interest in {selectedPlayer?.name}</DialogTitle>
            <DialogDescription>
              {selectedPlayer?.commitmentStatus === 'FREE_AGENT'
                ? 'Your message will be delivered to the player in their portal.'
                : `Your message will be sent to the ${selectedPlayer?.club} captain for discussion.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="engagement-message">Message</Label>
            <Textarea
              id="engagement-message"
              placeholder="Introduce your club and why you would like to discuss a possible transfer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlayer(null)}>Cancel</Button>
            <Button onClick={handleExpressInterest}>Send interest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingPageShell>
  )
}
