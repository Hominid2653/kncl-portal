import { Link } from 'react-router-dom'

import {
  ActivityListSkeleton,
  DashboardStatsSkeleton,
  PageHeaderSkeleton,
} from '@/components/skeletons/page-skeletons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePortalData } from '@/context/PortalDataContext'
import PortalLayout from '@/layouts/PortalLayout'

export default function AdminDashboardPage() {
  const { getScopedPendingCounts } = useOnboarding()
  const { user } = useAuth()
  const { adminDashboardStats, auditLogs, loading } = usePortalData()
  const pending = getScopedPendingCounts(user)

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
