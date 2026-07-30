import { Link } from 'react-router-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSeason } from '@/context/SeasonContext'
import { usePortalData } from '@/context/PortalDataContext'

export default function AboutPage() {
  const { seasons } = useSeason()
  const { leagues } = usePortalData()
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-6">
      <div className="max-w-3xl space-y-4">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">About KNCL</p>
        <h1 className="text-3xl font-semibold tracking-tight">Kenya National Chess League</h1>
        <p className="text-base leading-7 text-muted-foreground">
          The KNCL Transfer Portal supports official registration, club affiliation, and transfer management for Kenya&apos;s national chess league structure.
        </p>
      </div>

      <Alert className="border-l-4 border-l-kenya-green">
        <AlertTitle>How onboarding works</AlertTitle>
        <AlertDescription>
          Federation officials create league coordinator accounts. Coordinators approve new club and captain applications before captains can sign in. Players register as free agents first; captains build rosters only from existing free agents during transfer windows via engagement and transfer workflows.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Role responsibilities</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Federation official</CardTitle>
              <CardDescription>Creates league coordinator accounts and oversees federation settings.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>League coordinator</CardTitle>
              <CardDescription>Reviews club/captain applications, approves registrations and transfers.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Club captain</CardTitle>
              <CardDescription>Manages roster from free agents during transfer windows after application approval.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Player</CardTitle>
              <CardDescription>Creates a profile as a free agent, then joins clubs through engagement and transfer.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="leagues" className="space-y-4">
        <h2 className="text-xl font-semibold">Leagues &amp; seasons</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {leagues.map((league) => (
            <Card key={league.id}>
              <CardHeader>
                <CardTitle>{league.name}</CardTitle>
                <CardDescription>{league.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Active seasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {seasons.map((season) => (
              <div key={season.id} className="flex flex-col gap-1 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>{season.name} <span className="text-muted-foreground">· {season.leagueName}</span></span>
                <span className="text-muted-foreground">
                  Roster enrollment {season.rosterEnrollmentOpen ? 'open' : 'closed'} · Transfers {season.transfersOpen ? 'open' : 'closed'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link to="/register" />}>Register</Button>
        <Button variant="outline" render={<Link to="/login" />}>Access the portal</Button>
      </div>
    </div>
  )
}
