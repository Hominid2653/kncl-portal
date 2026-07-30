import { Link } from 'react-router-dom'
import { RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'

import PlayerRatingsBadges from '@/components/player-ratings'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registrationStatusLabels, registrationStatusVariants, transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import { usePortalData } from '@/context/PortalDataContext'
import { useTransfers } from '@/context/TransferContext'
import { hasAnyRating, ratingSourceLabel } from '@/lib/player-ratings'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerDashboardPage() {
  const { user } = useAuth()
  const { getPlayerEngagements } = useEngagements()
  const { playerDashboardStats, registrations, notifications, playerById } = usePortalData()
  const { transfers } = useTransfers()
  const player = user?.playerId ? playerById(user.playerId) : undefined
  const engagements = user?.playerId ? getPlayerEngagements(user.playerId) : []
  const pendingEngagements = engagements.filter((e) => e.status === 'PENDING')

  const ratings = {
    classicalRating: player?.classicalRating ?? player?.fideRating,
    rapidRating: player?.rapidRating,
    blitzRating: player?.blitzRating,
    fideId: player?.fideId,
    lichessUsername: player?.lichessUsername,
    chesscomUsername: player?.chesscomUsername,
  }

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your registrations, ratings, transfers, and notifications.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {playerDashboardStats.map((s) => (
            <Card key={s.label}>
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-2xl">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {player && (
          <Card className="border-l-4 border-l-kenya-green">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Your ratings</CardTitle>
                <CardDescription>
                  Synced from {ratingSourceLabel(ratings)}
                  {player.fideId ? ` · FIDE ID ${player.fideId}` : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" render={<Link to="/player/accounts" />}>
                <RefreshCwIcon className="size-4" data-icon="inline-start" />
                Manage accounts
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAnyRating(ratings) ? (
                <PlayerRatingsBadges ratings={ratings} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No ratings yet. Link your FIDE ID or online chess accounts to sync ratings.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {player.lichessVerified && (
                  <Badge variant="secondary">
                    <ShieldCheckIcon className="size-3" data-icon="inline-start" />
                    Lichess verified
                  </Badge>
                )}
                {player.chesscomVerified && (
                  <Badge variant="secondary">
                    <ShieldCheckIcon className="size-3" data-icon="inline-start" />
                    Chess.com verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {pendingEngagements.length > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingEngagements.length} club interest request{pendingEngagements.length > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Clubs have expressed interest in signing you. Review and respond in engagements.</span>
              <Button size="sm" variant="outline" render={<Link to="/player/engagements" />}>View engagements</Button>
            </AlertDescription>
          </Alert>
        )}

        {!hasAnyRating(ratings) && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>Link your chess accounts</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Add your FIDE ID first, or link Lichess and Chess.com to display ratings on your profile and listings.</span>
              <Button size="sm" render={<Link to="/player/accounts" />}>External accounts</Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Recent registrations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {registrations.slice(0, 2).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <span>{r.season}</span>
                  <Badge variant={registrationStatusVariants[r.status]}>{registrationStatusLabels[r.status]}</Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" render={<Link to="/player/registrations" />}>View all</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent transfers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {transfers.slice(0, 2).map((t) => (
                <div key={t.id} className="rounded-lg border px-4 py-3 text-sm">
                  <p>{t.fromClub} → {t.toClub}</p>
                  <Badge className="mt-2" variant={transferStatusVariants[t.status]}>{transferStatusLabels[t.status]}</Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" render={<Link to="/player/transfers" />}>View all</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </div>
                {!n.read && <Badge variant="outline">New</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
