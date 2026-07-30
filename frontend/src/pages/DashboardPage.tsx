import { BadgeCheck, Clock3, ShieldCheck, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { stats } from '../data/mockData'

const highlights = [
  'New player submissions require verification before approval',
  'Transfer requests can be tracked from submission to final decision',
  'Admins can review club and federation updates in one view',
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Operations overview</p>
            <h1 className="mt-2 text-3xl font-semibold">Manage transfers and player records efficiently</h1>
          </div>
          <Button className="bg-white text-slate-950 hover:bg-slate-100">Create report</Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} className="bg-white">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  {item.label.includes('players') ? <Users className="h-5 w-5" /> : item.label.includes('transfers') ? <Clock3 className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.label}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <span className="mt-0.5 rounded-full bg-slate-900 p-1 text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input placeholder="Search players or transfers" />
              <Button className="w-full">Find records</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
