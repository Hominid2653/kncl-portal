import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createCoordinator } from '@/api/applications'
import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { roleLabels } from '@/constants/roles'
import { useAuth } from '@/context/AuthContext'
import { usePortalData } from '@/context/PortalDataContext'
import { USE_API } from '@/lib/api-config'
import PortalLayout from '@/layouts/PortalLayout'
import type { UserProfileRecord } from '@/types'

const coordinatorSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  leagueId: z.string().min(1, 'Select a league'),
})

type CoordinatorForm = z.infer<typeof coordinatorSchema>

const columns: ColumnDef<UserProfileRecord, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="secondary">{roleLabels[row.original.role]}</Badge> },
  { accessorKey: 'phone', header: 'Phone' },
]

export default function AdminUserProfilesPage() {
  const { user, accessToken } = useAuth()
  const { userProfiles, leagues, refresh } = usePortalData()
  const [open, setOpen] = useState(false)
  const isFederationAdmin = user?.role === 'FEDERATION_ADMIN'

  const form = useForm<CoordinatorForm>({
    resolver: zodResolver(coordinatorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      leagueId: leagues[0]?.id ?? '',
    },
  })

  const onCreateCoordinator = async (data: CoordinatorForm) => {
    if (USE_API) {
      if (!accessToken) {
        toast.error('You must be signed in to create coordinators.')
        return
      }
      try {
        await createCoordinator(
          {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            league_ids: [data.leagueId],
          },
          accessToken,
        )
        await refresh()
        toast.success('League coordinator account created. They will receive a welcome email with sign-in instructions.')
        setOpen(false)
        form.reset()
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create coordinator.')
        return
      }
    }
    toast.success('League coordinator account created.')
    setOpen(false)
    form.reset()
  }

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User profiles</h1>
            <p className="text-sm text-muted-foreground">
              Federation officials manage coordinator accounts. Coordinators onboard clubs and captains.
            </p>
          </div>
          {isFederationAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><PlusIcon data-icon="inline-start" />Create coordinator</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create league coordinator</DialogTitle>
                  <DialogDescription>
                    Federation officials provision coordinator accounts. Coordinators review club/captain applications and manage teams.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateCoordinator)} className="grid gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="leagueId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>League</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leagues.map((league) => (
                              <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button type="submit">Create account</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle>Federation users</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={userProfiles} searchKey="name" searchPlaceholder="Search users..." />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
