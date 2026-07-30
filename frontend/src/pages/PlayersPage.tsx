import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { playerRecords } from '../data/mockData'

function PlayersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-950">Players directory</h1>
        <p className="mt-2 text-sm text-slate-600">Browse verified and pending player records.</p>
      </header>

      <div className="grid gap-4">
        {playerRecords.map((player) => (
          <Card key={player.id}>
            <CardHeader>
              <CardTitle>{player.name}</CardTitle>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{player.status}</span>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:justify-between">
                <span>Club: {player.club}</span>
                <span>Rating: {player.rating}</span>
                <span>Updated: {player.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PlayersPage
