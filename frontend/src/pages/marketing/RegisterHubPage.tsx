import { Link } from 'react-router-dom'
import { ArrowRightIcon, ClipboardListIcon, ShieldIcon, UserCircle2Icon, UsersIcon } from 'lucide-react'

import MarketingPageShell from '@/components/marketing/MarketingPageShell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const options = [
  {
    title: 'Register as club captain',
    description: 'Submit your club details for coordinator approval. Sign in only after your application is approved.',
    href: '/register/captain',
    icon: ShieldIcon,
  },
  {
    title: 'Create player profile',
    description: 'Register as a free agent. Clubs discover you in listings and engage you during transfer windows.',
    href: '/register/player',
    icon: UserCircle2Icon,
  },
  {
    title: 'Browse player listings',
    description: 'View available free agents and committed players (for club captains after sign-in).',
    href: '/players',
    icon: UsersIcon,
  },
  {
    title: 'Check application status',
    description: 'Track your player or club application. Email verification required before viewing status.',
    href: '/register/status',
    icon: ClipboardListIcon,
  },
]

export default function RegisterHubPage() {
  return (
    <MarketingPageShell
      eyebrow="Get started"
      title="Register with KNCL"
      description="Federation officials create coordinator accounts. Coordinators approve new clubs and captains. Once approved, sign in with your application email."
      width="5xl"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {options.map((option) => (
          <Card
            key={option.href}
            className="group flex flex-col border-border/80 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex-1 gap-4">
              <div className="flex size-11 items-center justify-center rounded-lg border bg-muted/40 text-kenya-green transition-colors group-hover:bg-kenya-green/10">
                <option.icon className="size-5" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription className="text-sm leading-6">{option.description}</CardDescription>
              </div>
            </CardHeader>
            <div className="px-6 pb-6">
              <Button variant="outline" className="w-full" render={<Link to={option.href} />}>
                Continue
                <ArrowRightIcon data-icon="inline-end" className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </MarketingPageShell>
  )
}
