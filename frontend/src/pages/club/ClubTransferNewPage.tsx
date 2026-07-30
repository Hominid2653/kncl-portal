import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTransfers } from '@/context/TransferContext'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({
  playerName: z.string().min(2),
  fromClub: z.string().min(2),
  toClub: z.string().min(2),
  reason: z.string().optional(),
})

export default function ClubTransferNewPage() {
  const { submitManualTransfer } = useTransfers()
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { playerName: '', fromClub: '', toClub: '', reason: '' } })
  return (
    <PortalLayout portalLabel="Admin portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Manual transfer entry</h1>
          <p className="text-sm text-muted-foreground">Coordinator/federation only — for edge cases outside the engagement workflow.</p>
        </div>
        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Restricted action</AlertTitle>
          <AlertDescription>Club captains must use Engagements → Initiate transfer. This form is for league coordinators correcting data or handling exceptions.</AlertDescription>
        </Alert>
        <Card>
          <CardHeader><CardTitle>Transfer request</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => {
                submitManualTransfer(data)
                form.reset()
              })} className="space-y-4">
                <FormField control={form.control} name="playerName" render={({ field }) => (<FormItem><FormLabel>Player</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fromClub" render={({ field }) => (<FormItem><FormLabel>From club</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="toClub" render={({ field }) => (<FormItem><FormLabel>To club</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="reason" render={({ field }) => (<FormItem><FormLabel>Reason</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit">Submit transfer</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
