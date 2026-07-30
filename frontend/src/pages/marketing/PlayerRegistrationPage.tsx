import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { EmailOtpVerification } from '@/components/email-otp-verification'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePortalData } from '@/context/PortalDataContext'

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  county: z.string().min(2),
  nationality: z.string().min(2),
  leagueId: z.string().min(1),
})

type PlayerForm = z.infer<typeof schema>

export default function PlayerRegistrationPage() {
  const navigate = useNavigate()
  const { submitPlayerRegistration } = useOnboarding()
  const { leagues } = usePortalData()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [pendingData, setPendingData] = useState<PlayerForm | null>(null)

  const form = useForm<PlayerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      county: '',
      nationality: 'Kenya',
      leagueId: leagues[0]?.id ?? '',
    },
  })

  const onFormSubmit = (data: PlayerForm) => {
    setPendingData(data)
    setStep('verify')
  }

  const onEmailVerified = (token: string) => {
    if (!pendingData) return
    const league = leagues.find((l) => l.id === pendingData.leagueId) ?? leagues[0]
    const id = submitPlayerRegistration({ ...pendingData, leagueName: league?.name ?? 'League' }, token)
    if (!id) return

    form.reset({ firstName: '', lastName: '', email: '', county: '', nationality: 'Kenya', leagueId: leagues[0]?.id ?? '' })
    setPendingData(null)
    setStep('form')
    navigate(`/register/status?email=${encodeURIComponent(pendingData.email)}&type=player&verified=1`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">Player onboarding</p>
        <h1 className="text-3xl font-semibold tracking-tight">Create your player profile</h1>
        <p className="text-muted-foreground">
          Register as a free agent. A league coordinator must approve your details before you appear in listings.
        </p>
      </div>

      <Alert className="border-l-4 border-l-kenya-green">
        <AlertTitle>Email verification &amp; coordinator approval</AlertTitle>
        <AlertDescription>
          Verify your email before submitting. If rejected, you will receive a message explaining what to correct before reapplying.
        </AlertDescription>
      </Alert>

      {step === 'form' ? (
        <Card>
          <CardHeader>
            <CardTitle>Player profile request</CardTitle>
            <CardDescription>Federation ID is assigned on approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="grid gap-4 md:grid-cols-2">
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
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="county" render={({ field }) => (
                  <FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <Button type="submit">Continue to email verification</Button>
                  <Button variant="outline" render={<Link to="/players" />}>Browse player listings</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Confirm ownership of {pendingData?.email} before we submit your profile request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingData && (
              <EmailOtpVerification
                email={pendingData.email}
                purpose="APPLICATION_SUBMIT"
                autoSend
                onVerified={onEmailVerified}
              />
            )}
            <Button type="button" variant="ghost" onClick={() => setStep('form')}>
              Back to profile form
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
