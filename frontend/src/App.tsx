import './App.css'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { ArrowRight, BadgeCheck, Clock3, ShieldCheck, Users } from 'lucide-react'

const stats = [
  { label: 'Active players', value: '1,248', detail: 'Across 42 clubs', icon: Users },
  { label: 'Pending transfers', value: '36', detail: 'Reviewed this week', icon: Clock3 },
  { label: 'Verified profiles', value: '94%', detail: 'Cross-checked by staff', icon: BadgeCheck },
]

const workflow = [
  'Submit player registration and supporting details',
  'Track transfer approvals from club and league reviewers',
  'Monitor player eligibility and verification progress',
]

function App() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">KNCL Transfer Portal</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A structured home for registrations and transfers
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">View dashboard</Button>
              <Button>Open application</Button>
            </div>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <Card className="border-slate-200 bg-slate-950 text-white shadow-md">
              <CardContent className="space-y-5 p-8 sm:p-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-slate-100">
                  <ShieldCheck className="h-4 w-4" />
                  Trusted by clubs and league administrators
                </div>
                <div className="max-w-2xl space-y-3">
                  <h2 className="text-2xl font-semibold sm:text-3xl">
                    Centralize player movement, verification, and approvals in one place.
                  </h2>
                  <p className="text-sm leading-7 text-slate-300 sm:text-base">
                    The portal is designed to simplify player onboarding, transfers, and record management with a clear and dependable experience.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-white text-slate-950 hover:bg-slate-100">Start registration</Button>
                  <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Review workflow
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.label} className="bg-white">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                          <p className="text-sm text-slate-500">{item.label}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-600">{item.detail}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portal coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {workflow.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <span className="mt-0.5 rounded-full bg-slate-900 p-1 text-white">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input placeholder="Search players or transfers" />
                  <Button className="w-full">Find records</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
