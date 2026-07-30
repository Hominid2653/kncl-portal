import { Card, CardContent } from '../components/ui/card'
import { transferQueue } from '../data/mockData'

function TransfersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-950">Transfer requests</h1>
        <p className="mt-2 text-sm text-slate-600">Review incoming transfer applications and approval states.</p>
      </header>

      <div className="space-y-4">
        {transferQueue.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.playerName}</p>
                  <p className="text-sm text-slate-600">{item.fromClub} → {item.toClub}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{item.status}</span>
                  <span className="text-sm text-slate-500">Submitted {item.submitted}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TransfersPage
