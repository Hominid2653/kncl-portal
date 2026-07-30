import { Link } from 'react-router-dom'
import { ClipboardListIcon, ShieldIcon, UserCircle2Icon, UsersIcon } from 'lucide-react'

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
    description: 'Track your player or club application and see coordinator feedback if rejected.',
    href: '/register/status',
    icon: ClipboardListIcon,
  },
]

export default function RegisterHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">Get started</p>
        <h1 className="text-3xl font-semibold tracking-tight">Register with KNCL</h1>
        <p className="text-muted-foreground">
          Federation officials create coordinator accounts. Coordinators approve new clubs and captains. Once approved, sign in with your application email.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option) => (
          <Card key={option.href} className="flex flex-col">
            <CardHeader>
              <option.icon className="mb-2 size-5 text-kenya-green" />
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <div className="mt-auto px-6 pb-6">
              <Button variant="outline" className="w-full" render={<Link to={option.href} />}>Continue</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
