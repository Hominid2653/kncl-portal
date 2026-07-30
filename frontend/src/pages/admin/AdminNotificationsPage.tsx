import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { createNotification } from '@/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/context/PortalDataContext'
import { USE_API } from '@/lib/api-config'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({
  userProfileId: z.string().min(1, 'Select a recipient'),
  title: z.string().min(2),
  message: z.string().min(2),
})

type NotificationForm = z.infer<typeof schema>

export default function AdminNotificationsPage() {
  const { notifications, userProfiles, refresh } = usePortalData()
  const [open, setOpen] = useState(false)
  const form = useForm<NotificationForm>({
    resolver: zodResolver(schema),
    defaultValues: { userProfileId: '', title: '', message: '' },
  })

  const onCreate = async (data: NotificationForm) => {
    if (USE_API) {
      try {
        await createNotification({
          user_profile_id: data.userProfileId,
          title: data.title,
          message: data.message,
        })
        await refresh()
        toast.success('Notification sent.')
        setOpen(false)
        form.reset()
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create notification.')
        return
      }
    }
    toast.success('Notification created.')
    setOpen(false)
    form.reset()
  }

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div><h1 className="text-2xl font-semibold">Notifications</h1></div>
          <Button onClick={() => setOpen(true)}><PlusIcon data-icon="inline-start" />Create notification</Button>
        </div>
        <Card>
          <CardHeader><CardTitle>System notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.length ? notifications.map((n) => (
              <div key={n.id} className="flex justify-between rounded-lg border px-4 py-3">
                <div><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-muted-foreground">{n.message}</p></div>
                {!n.read && <Badge variant="outline">Unread</Badge>}
              </div>
            )) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create notification</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                <FormField control={form.control} name="userProfileId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userProfiles.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Send</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
