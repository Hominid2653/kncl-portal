import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

function RegistrationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-950">Player registration</h1>
        <p className="mt-2 text-sm text-slate-600">Create a new registration record for a player or club representative.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registration form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <Input placeholder="Player full name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Club</label>
              <Input placeholder="Assigned club" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" placeholder="player@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">FIDE rating</label>
              <Input placeholder="Optional" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Submit registration</Button>
            <Button variant="outline">Save draft</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegistrationPage
