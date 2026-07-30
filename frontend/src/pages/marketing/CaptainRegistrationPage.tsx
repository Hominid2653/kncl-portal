import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOnboarding } from '@/context/OnboardingContext'
import { leagues } from '@/data/mockData'

const schema = z.object({
  leagueId: z.string().min(1),
  clubName: z.string().min(2, 'Club name is required'),
  county: z.string().min(2, 'County is required'),
  description: z.string().optional(),
  captainFirstName: z.string().min(2),
  captainLastName: z.string().min(2),
  captainEmail: z.string().email(),
  captainPhone: z.string().min(10),
})

type CaptainForm = z.infer<typeof schema>

export default function CaptainRegistrationPage() {
  const navigate = useNavigate()
  const { submitClubApplication } = useOnboarding()
  const fileRef = useRef<HTMLInputElement>(null)
  const [charterFileName, setCharterFileName] = useState<string>()

  const form = useForm<CaptainForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      leagueId: leagues[0].id,
      clubName: '',
      county: '',
      description: '',
      captainFirstName: '',
      captainLastName: '',
      captainEmail: '',
      captainPhone: '',
    },
  })

  const onSubmit = (data: CaptainForm) => {
    const league = leagues.find((l) => l.id === data.leagueId) ?? leagues[0]
    submitClubApplication({
      ...data,
      leagueName: league.name,
      charterFileName,
      charterUrl: charterFileName ? '#' : undefined,
    })
    form.reset({ leagueId: leagues[0].id, clubName: '', county: '', description: '', captainFirstName: '', captainLastName: '', captainEmail: '', captainPhone: '' })
    setCharterFileName(undefined)
    navigate(`/register/status?email=${encodeURIComponent(data.captainEmail)}&type=club`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">Club onboarding</p>
        <h1 className="text-3xl font-semibold tracking-tight">Register as a club captain</h1>
        <p className="text-muted-foreground">
          Submit your club and captain details for league coordinator review. You will receive portal access once approved.
        </p>
      </div>

      <Alert className="border-l-4 border-l-kenya-green">
        <AlertTitle>Approval required before sign-in</AlertTitle>
        <AlertDescription>
          A league coordinator reviews each application. Approved clubs receive an initial roster period to build their squad from free agents.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Club &amp; captain application</CardTitle>
          <CardDescription>Include an optional club charter document for faster review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="leagueId" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>League</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {leagues.map((league) => (
                        <SelectItem key={league.id} value={league.id}>{league.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="clubName" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Club name</FormLabel><FormControl><Input placeholder="Eldoret Falcons" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="county" render={({ field }) => (
                <FormItem><FormLabel>County</FormLabel><FormControl><Input placeholder="Uasin Gishu" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Club description (optional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2 space-y-2">
                <FormLabel>Club charter (optional)</FormLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>Upload charter</Button>
                  <span className="text-sm text-muted-foreground">{charterFileName ?? 'PDF or image, max 10MB'}</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => setCharterFileName(e.target.files?.[0]?.name)}
                />
              </div>
              <FormField control={form.control} name="captainFirstName" render={({ field }) => (
                <FormItem><FormLabel>Captain first name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="captainLastName" render={({ field }) => (
                <FormItem><FormLabel>Captain last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="captainEmail" render={({ field }) => (
                <FormItem><FormLabel>Captain email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="captainPhone" render={({ field }) => (
                <FormItem><FormLabel>Captain phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit">Submit application</Button>
                <Button variant="outline" render={<Link to="/login" />}>Already approved? Sign in</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
