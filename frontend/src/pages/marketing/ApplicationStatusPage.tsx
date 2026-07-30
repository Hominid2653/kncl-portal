import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { fetchApplicationStatus } from '@/api/application-status'
import { EmailOtpVerification } from '@/components/email-otp-verification'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { registrationStatusLabels, registrationStatusVariants } from '@/constants/status'
import { useOnboarding } from '@/context/OnboardingContext'
import { USE_API } from '@/lib/api-config'
import type { ApplicationStatus } from '@/types'

const schema = z.object({
  email: z.string().email('Enter the email used on your application'),
})

type StatusForm = z.infer<typeof schema>

function formatSubmittedAt(value: string) {
  try {
    return new Date(value).toLocaleString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return value
  }
}

export default function ApplicationStatusPage() {
  const [searchParams] = useSearchParams()
  const { getClubApplicationByEmail, getPlayerApplicationByEmail } = useOnboarding()
  const [activeTab, setActiveTab] = useState<'player' | 'club'>(
    searchParams.get('type') === 'club' ? 'club' : 'player',
  )
  const [step, setStep] = useState<'email' | 'verify' | 'results'>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [apiStatus, setApiStatus] = useState<Awaited<ReturnType<typeof fetchApplicationStatus>>>(null)

  const form = useForm<StatusForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  })

  const mockPlayerApp = verifiedEmail ? getPlayerApplicationByEmail(verifiedEmail) : undefined
  const mockClubApp = verifiedEmail ? getClubApplicationByEmail(verifiedEmail) : undefined

  const playerApp = USE_API && apiStatus?.player_application
    ? {
        firstName: apiStatus.player_application.first_name,
        lastName: apiStatus.player_application.last_name,
        email: verifiedEmail,
        status: apiStatus.player_application.status as ApplicationStatus,
        rejectionReason: apiStatus.player_application.rejection_reason ?? undefined,
        submittedAt: formatSubmittedAt(apiStatus.player_application.submitted_at),
        leagueName: 'KNCL',
        federationId: undefined,
      }
    : mockPlayerApp

  const clubApp = USE_API && apiStatus?.club_application
    ? {
        clubName: apiStatus.club_application.club_name,
        captainEmail: verifiedEmail,
        captainFirstName: '',
        captainLastName: '',
        status: apiStatus.club_application.status as ApplicationStatus,
        rejectionReason: apiStatus.club_application.rejection_reason ?? undefined,
        leagueName: 'KNCL',
      }
    : mockClubApp

  const onEmailSubmit = (data: StatusForm) => {
    setPendingEmail(data.email)
    setStep('verify')
  }

  const onVerified = async (token: string) => {
    setVerifiedEmail(pendingEmail)
    if (USE_API) {
      const status = await fetchApplicationStatus(token)
      setApiStatus(status)
    }
    setStep('results')
  }

  const resetLookup = () => {
    setStep('email')
    setPendingEmail('')
    setVerifiedEmail('')
    setApiStatus(null)
    form.reset({ email: '' })
  }

  useEffect(() => {
    const email = searchParams.get('email')
    if (email && searchParams.get('verified') === '1') {
      setPendingEmail(email)
      setVerifiedEmail(email)
      setStep('results')
      form.setValue('email', email)
    }
  }, [searchParams, form])

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">Application tracker</p>
        <h1 className="text-3xl font-semibold tracking-tight">Check application status</h1>
        <p className="text-muted-foreground">
          Verify your email to view application status. Once approved, sign in with the email and password from your welcome email.
        </p>
      </div>

      {step === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Look up application</CardTitle>
            <CardDescription>We&apos;ll send a verification code before showing your status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4 sm:flex-row">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="sm:self-end">Send verification code</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Enter the code sent to {pendingEmail}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmailOtpVerification
              email={pendingEmail}
              purpose="STATUS_LOOKUP"
              autoSend
              onVerified={(token) => void onVerified(token)}
            />
            <Button type="button" variant="ghost" onClick={() => setStep('email')}>
              Use a different email
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'results' && verifiedEmail && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing results for <strong>{verifiedEmail}</strong>
            </p>
            <Button type="button" variant="outline" size="sm" onClick={resetLookup}>
              Look up another email
            </Button>
          </div>

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
                          Use your email at the login page. Check your inbox for a welcome email with your temporary password.
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
                        <AlertDescription>A league coordinator is reviewing your player profile.</AlertDescription>
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
                    <CardDescription>
                      {clubApp.leagueName}
                      {clubApp.captainFirstName ? ` · Captain: ${clubApp.captainFirstName} ${clubApp.captainLastName}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {clubApp.status === 'APPROVED' && (
                      <Alert className="border-l-4 border-l-kenya-green">
                        <AlertTitle>Approved — captain account ready</AlertTitle>
                        <AlertDescription>
                          Sign in with <strong>{clubApp.captainEmail}</strong>. Check your welcome email for your temporary password.
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
        </>
      )}
    </div>
  )
}
