import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortalData } from '@/context/PortalDataContext'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerNotificationsPage() {
  const { notifications } = usePortalData()
  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Notifications</h1><p className="text-sm text-muted-foreground">Updates about registrations, transfers, and verification.</p></div>
        <Card>
          <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.length ? notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between rounded-lg border px-4 py-3">
                <div><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.message}</p><p className="mt-1 text-xs text-muted-foreground">{n.createdAt}</p></div>
                {!n.read && <Badge variant="outline">New</Badge>}
              </div>
            )) : <p className="text-sm text-muted-foreground">All caught up.</p>}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
