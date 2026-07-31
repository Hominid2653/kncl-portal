import { Link } from 'react-router-dom'
import {
  Building2Icon,
  CrownIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'

import MarketingPageShell from '@/components/marketing/MarketingPageShell'
import MarketingSection from '@/components/marketing/MarketingSection'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSeason } from '@/context/SeasonContext'
import { usePortalData } from '@/context/PortalDataContext'

const roles = [
  {
    title: 'Federation official',
    description: 'Creates league coordinator accounts and oversees federation settings.',
    icon: CrownIcon,
  },
  {
    title: 'League coordinator',
    description: 'Reviews club and captain applications, approves registrations and transfers.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Club captain',
    description: 'Manages roster from free agents during transfer windows after application approval.',
    icon: Building2Icon,
  },
  {
    title: 'Player',
    description: 'Creates a profile as a free agent, then joins clubs through engagement and transfer.',
    icon: UsersIcon,
  },
]

export default function AboutPage() {
  const { seasons } = useSeason()
  const { leagues } = usePortalData()

  return (
    <MarketingPageShell
      eyebrow="About KNCL"
      title="Kenya National Chess League"
      description="The KNCL Transfer Portal supports official registration, club affiliation, and transfer management for Kenya's national chess league structure."
    >
      <Alert className="border-l-4 border-l-kenya-green bg-kenya-green/5">
        <AlertTitle>How onboarding works</AlertTitle>
        <AlertDescription className="leading-6">
          Federation officials create league coordinator accounts. Coordinators approve new club and captain applications before captains can sign in. Players register as free agents first; captains build rosters only from existing free agents during transfer windows via engagement and transfer workflows.
        </AlertDescription>
      </Alert>

      <MarketingSection
        title="Role responsibilities"
        description="Each role has defined permissions within the portal to keep league operations structured and auditable."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.title} className="border-border/80 shadow-sm">
              <CardHeader className="gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40 text-kenya-green">
                  <role.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
                <CardDescription className="text-sm leading-6">{role.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="Leagues & seasons"
        description="Active leagues and season windows determine when rosters can be built and transfers processed."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {leagues.map((league) => (
            <Card key={league.id} id="leagues" className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{league.name}</CardTitle>
                <CardDescription className="leading-6">{league.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active seasons</CardTitle>
            <CardDescription>Current enrollment and transfer window status by season.</CardDescription>
          </CardHeader>
          <div className="divide-y border-t px-6 pb-6">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex flex-col gap-3 py-4 first:pt-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{season.name}</p>
                  <p className="text-sm text-muted-foreground">{season.leagueName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={season.rosterEnrollmentOpen ? 'default' : 'secondary'}>
                    Roster {season.rosterEnrollmentOpen ? 'open' : 'closed'}
                  </Badge>
                  <Badge variant={season.transfersOpen ? 'default' : 'secondary'}>
                    Transfers {season.transfersOpen ? 'open' : 'closed'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </MarketingSection>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-8">
        <Button render={<Link to="/register" />}>Register</Button>
        <Button variant="outline" render={<Link to="/login" />}>Access the portal</Button>
      </div>
    </MarketingPageShell>
  )
}
