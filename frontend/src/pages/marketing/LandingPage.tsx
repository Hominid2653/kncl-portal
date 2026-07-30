import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  HandshakeIcon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'

import MarketingImageBackdrop from '@/components/marketing/MarketingImageBackdrop'
import MarketingSection from '@/components/marketing/MarketingSection'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Player registry',
    description: 'Centralised profiles with verification status, ratings, and club history.',
    icon: UsersIcon,
  },
  {
    title: 'Club management',
    description: 'Captains manage rosters, registrations, and transfer submissions.',
    icon: Building2Icon,
  },
  {
    title: 'Transfer workflows',
    description: 'Structured approval from club submission to league decision.',
    icon: HandshakeIcon,
  },
  {
    title: 'Account verification',
    description: 'Link and verify Lichess and Chess.com accounts.',
    icon: BadgeCheckIcon,
  },
]

const journey = [
  {
    title: 'Apply & verify',
    description: 'Submit your club or player application and confirm your email address.',
    icon: MailIcon,
  },
  {
    title: 'Coordinator review',
    description: 'League coordinators assess applications and keep the registry accurate.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Sign in & compete',
    description: 'Approved users access the portal to manage rosters, transfers, and listings.',
    icon: ArrowRightIcon,
  },
]

export default function LandingPage() {
  return (
    <>
      <MarketingImageBackdrop
        variant="hero"
        className="min-h-[32rem] border-b border-kenya-red/30 sm:min-h-[36rem] lg:min-h-[40rem]"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div className="space-y-6 text-white">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/60 uppercase">
              Official league operations
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Kenya National Chess League registration &amp; transfer portal
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/75">
              A professional federation system for player registration, club transfers, and verified records — built for officials, coordinators, captains, and players.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="border-kenya-green bg-kenya-green text-white hover:bg-kenya-green/90"
                render={<Link to="/login" />}
              >
                Sign in
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                render={<Link to="/register" />}
              >
                Register
              </Button>
              <Button
                variant="outline"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                render={<Link to="/players" />}
              >
                Browse players
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-white/55 uppercase">
              How onboarding works
            </p>
            <ul className="mt-6 space-y-6">
              {journey.map((step) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                    <step.icon className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingImageBackdrop>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <MarketingSection
          title="Built for federation operations"
          description="Structured workflows with role-based access for every stakeholder in Kenyan chess."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40 text-kenya-green">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </MarketingSection>
      </div>

      <MarketingImageBackdrop variant="cta" className="border-t border-kenya-red/20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 sm:py-16">
          <div className="max-w-xl space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/55 uppercase">Join KNCL</p>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Ready to get started?</h2>
            <p className="text-sm leading-6 text-white/75 sm:text-base">
              Register a club or player profile, or sign in if your application has already been approved.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="border-kenya-green bg-kenya-green text-white hover:bg-kenya-green/90"
              render={<Link to="/register" />}
            >
              Start registration
            </Button>
            <Button
              variant="outline"
              className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              render={<Link to="/about" />}
            >
              Learn about KNCL
            </Button>
          </div>
        </div>
      </MarketingImageBackdrop>
    </>
  )
}
