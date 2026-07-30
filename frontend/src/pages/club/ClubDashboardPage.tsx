import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useEngagements } from '@/context/EngagementContext'
import { clubDashboardStats } from '@/data/mockData'
import PortalLayout from '@/layouts/PortalLayout'

export default function ClubDashboardPage() {
  const { user } = useAuth()
  const { getClubEngagements } = useEngagements()
  const engagements = user?.clubId ? getClubEngagements(user.clubId) : []
  const pendingEngagements = engagements.filter((e) => e.status === 'PENDING')

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-semibold">Club dashboard</h1><p className="text-sm text-muted-foreground">{user?.clubName ?? 'Club'} — roster and submission overview.</p></div>
          <Button render={<Link to="/club/registrations/new" />}>New registration</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {clubDashboardStats.map((s) => (
            <Card key={s.label}><CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-2xl">{s.value}</CardTitle></CardHeader></Card>
          ))}
        </div>
        {pendingEngagements.length > 0 && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>{pendingEngagements.length} incoming engagement{pendingEngagements.length > 1 ? 's' : ''}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Other clubs have expressed interest in your players. Review requests in engagements.</span>
              <Button size="sm" variant="outline" render={<Link to="/club/engagements" />}>View engagements</Button>
            </AlertDescription>
          </Alert>
        )}
        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Registration guidance</AlertTitle>
          <AlertDescription>Registrations are reviewed by league coordinators. You will be notified when approved.</AlertDescription>
        </Alert>
      </div>
    </PortalLayout>
  )
}
