import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import PlayerHeadshotUpload from '@/components/player-headshot-upload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { KNCL_LEAGUE_ID } from '@/lib/coordinator'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({
  federationId: z.string().min(1),
  nationality: z.string().min(1),
  fideRating: z.string().optional(),
})

export default function PlayerProfilePage() {
  const { user } = useAuth()
  const { listings, submitHeadshotForReview, getHeadshotUrl, getPendingHeadshotForPlayer } = usePlayerListings()
  const player = listings.find((p) => p.id === user?.playerId) ?? listings[0]
  const pendingHeadshot = user?.playerId ? getPendingHeadshotForPlayer(user.playerId) : undefined

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      federationId: player.federationId,
      nationality: player.nationality,
      fideRating: String(player.fideRating ?? ''),
    },
  })

  const headshotUrl = getHeadshotUrl(player)

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My profile</h1>
          <p className="text-sm text-muted-foreground">Update your player record and public listing photo.</p>
        </div>

        {pendingHeadshot && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>Headshot pending review</AlertTitle>
            <AlertDescription>Your latest photo is awaiting coordinator approval before it appears on public listings.</AlertDescription>
          </Alert>
        )}

        <PlayerHeadshotUpload
          playerName={player.name}
          headshotUrl={pendingHeadshot?.proposedUrl ?? headshotUrl}
          onSave={(url) => {
            const playerId = user?.playerId ?? player.id
            submitHeadshotForReview(playerId, player.name, KNCL_LEAGUE_ID, url)
          }}
        />

        <Card>
          <CardHeader><CardTitle>{player.name}</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(async () => { toast.success('Profile saved (mock)') })} className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="federationId" render={({ field }) => (
                  <FormItem><FormLabel>Federation ID</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fideRating" render={({ field }) => (
                  <FormItem><FormLabel>FIDE rating</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="md:col-span-2"><Button type="submit">Save changes</Button></div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
