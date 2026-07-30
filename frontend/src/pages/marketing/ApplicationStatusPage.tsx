import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { useOnboarding } from '@/context/OnboardingContext'

const schema = z.object({
  email: z.string().email('Enter the email used on your application'),
})

type StatusForm = z.infer<typeof schema>

export default function ApplicationStatusPage() {
  const [searchParams] = useSearchParams()
  const { getClubApplicationByEmail, getPlayerApplicationByEmail } = useOnboarding()
  const [activeTab, setActiveTab] = useState<'player' | 'club'>(
    searchParams.get('type') === 'club' ? 'club' : 'player',
  )
  const [lookupEmail, setLookupEmail] = useState(searchParams.get('email') ?? '')

  const form = useForm<StatusForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  })

  const playerApp = lookupEmail ? getPlayerApplicationByEmail(lookupEmail) : undefined
  const clubApp = lookupEmail ? getClubApplicationByEmail(lookupEmail) : undefined

  const onSubmit = (data: StatusForm) => {
    setLookupEmail(data.email)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">Application tracker</p>
        <h1 className="text-3xl font-semibold tracking-tight">Check application status</h1>
        <p className="text-muted-foreground">
          Enter the email you used when registering. Once approved, you can sign in with that email (password setup via email coming with Resend integration).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Look up application</CardTitle>
          <CardDescription>No account needed — use the same email from your submission.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:flex-row">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="sm:self-end">Check status</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {lookupEmail && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'player' | 'club')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="player">Player application</TabsTrigger>
            <TabsTrigger value="club">Club application</TabsTrigger>
          </TabsList>

          <TabsContent value="player">
            {playerApp ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{playerApp.firstName} {playerApp.lastName}</CardTitle>
                    <Badge variant={registrationStatusVariants[playerApp.status]}>
                      {registrationStatusLabels[playerApp.status]}
                    </Badge>
                  </div>
                  <CardDescription>{playerApp.leagueName} · Submitted {playerApp.submittedAt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {playerApp.status === 'APPROVED' && (
                    <Alert className="border-l-4 border-l-kenya-green">
                      <AlertTitle>Approved — you can sign in</AlertTitle>
                      <AlertDescription>
                        Federation ID: <strong>{playerApp.federationId}</strong>. Use your email at the login page. Email password setup will be added when Resend is integrated.
                      </AlertDescription>
                    </Alert>
                  )}
                  {playerApp.status === 'REJECTED' && playerApp.rejectionReason && (
                    <Alert variant="destructive">
                      <AlertTitle>Application rejected</AlertTitle>
                      <AlertDescription>{playerApp.rejectionReason}</AlertDescription>
                    </Alert>
                  )}
                  {playerApp.status === 'PENDING' && (
                    <Alert>
                      <AlertTitle>Under review</AlertTitle>
                      <AlertDescription>A league coordinator is reviewing your player profile. Check back later.</AlertDescription>
                    </Alert>
                  )}
                  <Button render={<Link to="/login" state={{ email: playerApp.email }} />}>Go to sign in</Button>
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No player application found for this email.</AlertDescription></Alert>
            )}
          </TabsContent>

          <TabsContent value="club">
            {clubApp ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{clubApp.clubName}</CardTitle>
                    <Badge variant={registrationStatusVariants[clubApp.status]}>
                      {registrationStatusLabels[clubApp.status]}
                    </Badge>
                  </div>
                  <CardDescription>{clubApp.leagueName} · Captain: {clubApp.captainFirstName} {clubApp.captainLastName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {clubApp.status === 'APPROVED' && (
                    <Alert className="border-l-4 border-l-kenya-green">
                      <AlertTitle>Approved — captain account ready</AlertTitle>
                      <AlertDescription>
                        Sign in with <strong>{clubApp.captainEmail}</strong>. Your club has an initial roster period to add free agents.
                      </AlertDescription>
                    </Alert>
                  )}
                  {clubApp.status === 'REJECTED' && clubApp.rejectionReason && (
                    <Alert variant="destructive">
                      <AlertTitle>Application rejected</AlertTitle>
                      <AlertDescription>{clubApp.rejectionReason}</AlertDescription>
                    </Alert>
                  )}
                  {clubApp.status === 'PENDING' && (
                    <Alert>
                      <AlertTitle>Under review</AlertTitle>
                      <AlertDescription>A league coordinator is reviewing your club and captain details.</AlertDescription>
                    </Alert>
                  )}
                  <Button render={<Link to="/login" state={{ email: clubApp.captainEmail }} />}>Go to sign in</Button>
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No club application found for this email.</AlertDescription></Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
