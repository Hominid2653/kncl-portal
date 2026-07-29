import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const reportItems = [
  { title: 'Monthly registration volume', value: '128 submissions' },
  { title: 'Approval turnaround', value: '3.2 days average' },
  { title: 'Pending documents', value: '12 outstanding' },
]

function ReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-950">Reports</h1>
        <p className="mt-2 text-sm text-slate-600">Review key operational metrics and progress summaries.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {reportItems.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-slate-950">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
