import { HandshakeIcon } from 'lucide-react'

import PlayerRatingsBadges from '@/components/player-ratings'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { initials, usePlayerListings } from '@/context/PlayerListingsContext'
import type { PlayerListingRecord } from '@/types'

interface PlayerListingGridProps {
  players: PlayerListingRecord[]
  onExpressInterest?: (player: PlayerListingRecord) => void
  showActions?: boolean
}

function commitmentBadge(status: PlayerListingRecord['commitmentStatus']) {
  if (status === 'FREE_AGENT') {
    return <Badge className="border-kenya-green/30 bg-kenya-green/10 text-kenya-green">Free agent</Badge>
  }
  return <Badge variant="secondary">Committed</Badge>
}

export default function PlayerListingGrid({ players, onExpressInterest, showActions = true }: PlayerListingGridProps) {
  const { getHeadshotUrl } = usePlayerListings()

  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        No players match your search.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {players.map((player) => {
        const headshot = getHeadshotUrl(player)
        return (
          <Card key={player.id} className="overflow-hidden">
            <CardHeader className="items-center pb-2 text-center">
              <Avatar className="size-24">
                <AvatarImage src={headshot} alt={player.name} />
                <AvatarFallback className="text-xl">{initials(player.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 pt-2">
                <p className="font-semibold leading-tight">{player.name}</p>
                {player.title && <p className="text-xs text-muted-foreground">{player.title}</p>}
                <p className="text-xs text-muted-foreground">{player.federationId}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-center text-sm">
              <div className="flex flex-wrap justify-center gap-1">
                {commitmentBadge(player.commitmentStatus)}
              </div>
              <PlayerRatingsBadges
                ratings={{
                  classicalRating: player.classicalRating ?? player.fideRating,
                  rapidRating: player.rapidRating,
                  blitzRating: player.blitzRating,
                  fideId: player.fideId,
                }}
                size="sm"
                className="justify-center"
              />
              <p className="text-muted-foreground">{player.county}</p>
              {player.club && <p className="text-xs text-muted-foreground">{player.club}</p>}
            </CardContent>
            {showActions && onExpressInterest && (
              <CardFooter className="justify-center border-t bg-muted/20 py-3">
                <Button size="sm" variant="outline" onClick={() => onExpressInterest(player)}>
                  <HandshakeIcon className="size-4" data-icon="inline-start" />
                  Express interest
                </Button>
              </CardFooter>
            )}
          </Card>
        )
      })}
    </div>
  )
}
