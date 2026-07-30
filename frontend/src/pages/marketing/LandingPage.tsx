import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortalData } from '@/context/PortalDataContext'

const features = [
  { title: 'Player registry', description: 'Centralised profiles with verification status, ratings, and club history.' },
  { title: 'Club management', description: 'Captains manage rosters, registrations, and transfer submissions.' },
  { title: 'Transfer workflows', description: 'Structured approval from club submission to league decision.' },
  { title: 'Account verification', description: 'Link and verify Lichess and Chess.com accounts.' },
]

export default function LandingPage() {
  const { marketingStats } = usePortalData()
  return (
    <>
      <section className="border-b border-kenya-red/20 bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="space-y-6">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
              Official league operations
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Kenya National Chess League registration &amp; transfer portal
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              A professional federation system for player registration, club transfers, and verified records — built for officials, coordinators, captains, and players.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link to="/login" />}>
                Sign in
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button variant="outline" render={<Link to="/players" />}>
                Browse players
              </Button>
              <Button variant="outline" render={<Link to="/register" />}>
                Register
              </Button>
              <Button variant="outline" render={<Link to="/about" />}>
                Learn more
              </Button>
            </div>
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>League overview</CardTitle>
              <CardDescription>Current operational snapshot</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {marketingStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Built for federation operations</h2>
          <p className="mt-2 text-muted-foreground">Structured workflows with role-based access for every stakeholder in Kenyan chess.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="shadow-sm">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
