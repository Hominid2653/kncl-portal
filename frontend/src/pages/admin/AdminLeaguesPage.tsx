import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { createLeague } from '@/api/admin'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/context/PortalDataContext'
import { USE_API } from '@/lib/api-config'
import type { LeagueRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const leagueSchema = z.object({
  name: z.string().min(3, 'League name is required'),
  description: z.string().optional(),
})

type LeagueForm = z.infer<typeof leagueSchema>

export default function AdminLeaguesPage() {
  const { leagues, refresh } = usePortalData()
  const [open, setOpen] = useState(false)
  const form = useForm<LeagueForm>({
    resolver: zodResolver(leagueSchema),
    defaultValues: { name: '', description: '' },
  })

  const columns: ColumnDef<LeagueRecord, unknown>[] = [
    { accessorKey: 'name', header: 'League' },
    { accessorKey: 'description', header: 'Description' },
  ]

  const onCreate = async (data: LeagueForm) => {
    if (USE_API) {
      try {
        await createLeague({ name: data.name, description: data.description })
        await refresh()
        toast.success(`League "${data.name}" created.`)
        setOpen(false)
        form.reset()
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create league.')
        return
      }
    }
    toast.success(`League "${data.name}" created.`)
    setOpen(false)
    form.reset()
  }

  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-semibold">Leagues</h1>
          <Button onClick={() => setOpen(true)}><PlusIcon data-icon="inline-start" />Add league</Button>
        </div>
        <DataTable columns={columns} data={leagues} searchKey="name" searchPlaceholder="Search..." />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add league</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
