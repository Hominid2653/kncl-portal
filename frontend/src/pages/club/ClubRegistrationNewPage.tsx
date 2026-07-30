import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({ playerName: z.string().min(2), season: z.string().min(2) })

export default function ClubRegistrationNewPage() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { playerName: '', season: 'KNCL 2026 Season' } })
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Submit registration</h1></div>
        <Alert className="border-l-4 border-l-kenya-green"><AlertTitle>Review process</AlertTitle><AlertDescription>Submitted registrations start as PENDING until a league coordinator approves them.</AlertDescription></Alert>
        <Card>
          <CardHeader><CardTitle>Registration form</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(async () => toast.success('Registration submitted (mock)'))} className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="playerName" render={({ field }) => (<FormItem><FormLabel>Player</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="season" render={({ field }) => (<FormItem><FormLabel>Season</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="md:col-span-2"><Button type="submit">Submit registration</Button></div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
