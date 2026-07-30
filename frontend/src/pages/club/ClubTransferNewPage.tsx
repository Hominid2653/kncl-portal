import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
  toClub: z.string().min(2),
  reason: z.string().optional(),
})

export default function ClubTransferNewPage() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { playerName: '', toClub: '', reason: '' } })
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">Submit transfer</h1></div>
        <Alert className="border-l-4 border-l-kenya-green"><AlertTitle>Requirements</AlertTitle><AlertDescription>Transfers require an approved registration. Only one pending transfer per registration.</AlertDescription></Alert>
        <Card>
          <CardHeader><CardTitle>Transfer request</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(async () => toast.success('Transfer submitted (mock)'))} className="space-y-4">
                <FormField control={form.control} name="playerName" render={({ field }) => (<FormItem><FormLabel>Player</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="toClub" render={({ field }) => (<FormItem><FormLabel>Destination club</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
