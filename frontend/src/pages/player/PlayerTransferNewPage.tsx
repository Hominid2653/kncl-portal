import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useSeason } from '@/context/SeasonContext'
import { useTransfers } from '@/context/TransferContext'
import { canPlayerSubmitTransferRequest } from '@/lib/business-rules'
import { clubs } from '@/data/mockData'
import { getClubLeagueId } from '@/lib/coordinator'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({
  toClubId: z.string().min(1, 'Select a destination club'),
  reason: z.string().min(10, 'Explain your request (min 10 characters)'),
})

type TransferForm = z.infer<typeof schema>

export default function PlayerTransferNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { submitPlayerTransferRequest, getPendingTransferForPlayer } = useTransfers()
  const { isTransferWindowOpen, getSeasonForLeague } = useSeason()

  const leagueId = getClubLeagueId(user?.clubId)
  const season = getSeasonForLeague(leagueId)
  const canRequest = canPlayerSubmitTransferRequest(isTransferWindowOpen(leagueId), Boolean(user?.clubId))
  const pending = user?.playerId ? getPendingTransferForPlayer(user.playerId) : undefined
  const destinationClubs = clubs.filter((c) => c.id !== user?.clubId)

  const form = useForm<TransferForm>({
    resolver: zodResolver(schema),
    defaultValues: { toClubId: '', reason: '' },
  })

  const onSubmit = (data: TransferForm) => {
    if (!user?.clubId || !user.clubName) return
    const destination = clubs.find((c) => c.id === data.toClubId)
    if (!destination) return

    const id = submitPlayerTransferRequest({
      player: user,
      fromClubId: user.clubId,
      fromClubName: user.clubName,
      toClubId: destination.id,
      toClubName: destination.name,
      reason: data.reason,
      transfersOpen: isTransferWindowOpen(leagueId),
    })
    if (id) {
      form.reset()
      navigate('/player/transfers')
    }
  }

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Request a transfer</h1>
          <p className="text-sm text-muted-foreground">
            Hand in your personal terms. Your current captain and the destination club captain will be notified for club-to-club negotiation.
          </p>
        </div>

        {!user?.clubId ? (
          <Alert variant="destructive">
            <AlertTitle>Not affiliated with a club</AlertTitle>
            <AlertDescription>Only committed players can request transfers. Free agents join clubs via roster enrollment.</AlertDescription>
          </Alert>
        ) : !canRequest ? (
          <Alert variant="destructive">
            <AlertTitle>Transfer window closed</AlertTitle>
            <AlertDescription>
              Requests are only accepted when the transfer window is open for {season?.leagueName ?? 'your league'}.
            </AlertDescription>
          </Alert>
        ) : pending ? (
          <Alert>
            <AlertTitle>Pending request exists</AlertTitle>
            <AlertDescription>
              You already have transfer {pending.id} pending. <Link to="/player/transfers" className="underline">View transfers</Link>
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transfer request</CardTitle>
              <CardDescription>
                From <strong>{user.clubName}</strong> · {season?.name ?? 'Current season'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="toClubId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination club</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {destinationClubs.map((club) => (
                            <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal terms / reason</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Why you are requesting this move..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex gap-3">
                    <Button type="submit">Submit request</Button>
                    <Button type="button" variant="outline" render={<Link to="/player/transfers" />}>Cancel</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  )
}
