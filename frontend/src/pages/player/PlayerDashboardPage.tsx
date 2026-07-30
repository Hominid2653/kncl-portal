import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registrationStatusLabels, registrationStatusVariants, transferStatusLabels, transferStatusVariants } from '@/constants/status'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import { usePortalData } from '@/context/PortalDataContext'
import { useTransfers } from '@/context/TransferContext'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerDashboardPage() {
  const { user } = useAuth()
  const { getPlayerEngagements } = useEngagements()
  const { playerDashboardStats, registrations, notifications } = usePortalData()
  const { transfers } = useTransfers()
  const engagements = user?.playerId ? getPlayerEngagements(user.playerId) : []
  const pendingEngagements = engagements.filter((e) => e.status === 'PENDING')

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your registrations, transfers, and notifications.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {playerDashboardStats.map((s) => (
            <Card key={s.label}><CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-2xl">{s.value}</CardTitle></CardHeader></Card>
          ))}
        </div>
        {pendingEngagements.length > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingEngagements.length} club interest request{pendingEngagements.length > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Clubs have expressed interest in signing you. Review and respond in engagements.</span>
              <Button size="sm" variant="outline" render={<Link to="/player/engagements" />}>View engagements</Button>
            </AlertDescription>
          </Alert>
        )}
        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Verification reminder</AlertTitle>
          <AlertDescription>Link your Chess.com account to complete your player profile.</AlertDescription>
        </Alert>
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
                <div><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.message}</p></div>
                {!n.read && <Badge variant="outline">New</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
