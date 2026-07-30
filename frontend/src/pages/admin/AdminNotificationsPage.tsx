import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notifications } from '@/data/mockData'
import PortalLayout from '@/layouts/PortalLayout'

export default function AdminNotificationsPage() {
  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div><h1 className="text-2xl font-semibold">Notifications</h1></div>
          <Button onClick={() => toast.success('Notification created (mock)')}><PlusIcon data-icon="inline-start" />Create notification</Button>
        </div>
        <Card>
          <CardHeader><CardTitle>System notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex justify-between rounded-lg border px-4 py-3">
                <div><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.message}</p></div>
                {!n.read && <Badge variant="outline">Unread</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
