import { Link } from 'react-router-dom'

import {
  ActivityListSkeleton,
  DashboardStatsSkeleton,
  PageHeaderSkeleton,
} from '@/components/skeletons/page-skeletons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { usePortalData } from '@/context/PortalDataContext'
import { filterByLeagueScope } from '@/lib/coordinator'
import PortalLayout from '@/layouts/PortalLayout'

const actionLinks = [
  {
    key: 'club',
    label: 'Club applications',
    description: 'Review new club and captain registrations',
    href: '/admin/club-applications',
  },
  {
    key: 'player',
    label: 'Player applications',
    description: 'Approve free-agent profile requests',
    href: '/admin/player-applications',
  },
  {
    key: 'headshot',
    label: 'Headshot moderation',
    description: 'Publish or reject player profile photos',
    href: '/admin/headshot-moderation',
  },
  {
    key: 'transfers',
    label: 'Transfers',
    description: 'Review pending player transfers',
    href: '/admin/transfers',
  },
  {
    key: 'registrations',
    label: 'Roster enrollments',
    description: 'Approve season roster registrations',
    href: '/admin/registrations',
  },
] as const

export default function AdminDashboardPage() {
  const { getScopedPendingCounts } = useOnboarding()
  const { user } = useAuth()
  const { adminDashboardStats, adminPendingTransfers, adminPendingRegistrations, auditLogs, loading } = usePortalData()
  const { headshotModerations } = usePlayerListings()
  const pending = getScopedPendingCounts(user)
  const scopedHeadshots = filterByLeagueScope(user, headshotModerations).filter((h) => h.status === 'PENDING')

  const actionCounts: Record<string, number> = {
    club: pending.club,
    player: pending.player,
    headshot: scopedHeadshots.length,
    transfers: adminPendingTransfers,
    registrations: adminPendingRegistrations,
  }

  const totalActionable = actionCounts.club + actionCounts.player + actionCounts.headshot

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        {loading ? (
          <PageHeaderSkeleton />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground">Federation and league operations overview.</p>
          </div>
        )}

        {!loading && totalActionable === 0 && (
          <Alert>
            <AlertTitle>All clear</AlertTitle>
            <AlertDescription>No club, player, or headshot reviews are waiting on you right now.</AlertDescription>
          </Alert>
        )}

        {pending.club > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pending.club} club application{pending.club > 1 ? 's' : ''} awaiting review</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>New captains have submitted club registration requests.</span>
              <Button size="sm" variant="outline" render={<Link to="/admin/club-applications" />}>Review applications</Button>
            </AlertDescription>
          </Alert>
        )}
        {pending.player > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pending.player} player profile{pending.player > 1 ? 's' : ''} awaiting review</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>New players have requested free agent profiles.</span>
              <Button size="sm" variant="outline" render={<Link to="/admin/player-applications" />}>Review profiles</Button>
            </AlertDescription>
          </Alert>
        )}
        {scopedHeadshots.length > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{scopedHeadshots.length} headshot{scopedHeadshots.length > 1 ? 's' : ''} awaiting review</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Player photos need approval before they appear on public listings.</span>
              <Button size="sm" variant="outline" render={<Link to="/admin/headshot-moderation" />}>Moderate headshots</Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Action queue</CardTitle>
            <CardDescription>Jump to items that need coordinator attention.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-3">
            {actionLinks.map((item) => {
              const count = actionCounts[item.key] ?? 0
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className="flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}</Badge>
                </Link>
              )
            })}
          </div>
        </Card>

        {loading ? (
          <DashboardStatsSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {adminDashboardStats.map((s) => (
              <Card key={s.label}>
                <CardHeader>
                  <CardDescription>{s.label}</CardDescription>
                  <CardTitle className="text-2xl">{s.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <div className="space-y-2 px-6 pb-6">
            {loading ? (
              <ActivityListSkeleton rows={4} />
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border px-4 py-3 text-sm">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-muted-foreground">{log.entity} · {log.actor} · {log.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  )
}
