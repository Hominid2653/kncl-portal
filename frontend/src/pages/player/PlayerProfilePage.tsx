import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import PlayerHeadshotUpload from '@/components/player-headshot-upload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { usePortalData } from '@/context/PortalDataContext'
import { KNCL_LEAGUE_ID } from '@/lib/coordinator'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import PortalLayout from '@/layouts/PortalLayout'

const schema = z.object({
  federationId: z.string(),
  nationality: z.string(),
  fideRating: z.string().optional(),
})

export default function PlayerProfilePage() {
  const { user } = useAuth()
  const { playerById } = usePortalData()
  const { submitHeadshotForReview, submitHeadshotFile, getHeadshotUrl, getPendingHeadshotForPlayer } = usePlayerListings()

  const player = user?.playerId ? playerById(user.playerId) : undefined
  const pendingHeadshot = user?.playerId ? getPendingHeadshotForPlayer(user.playerId) : undefined

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      federationId: player?.federationId ?? '',
      nationality: player?.nationality ?? '',
      fideRating: String(player?.fideRating ?? ''),
    },
  })

  useEffect(() => {
    if (!player) return
    form.reset({
      federationId: player.federationId,
      nationality: player.nationality,
      fideRating: String(player.fideRating ?? ''),
    })
  }, [player, form])

  if (!player) {
    return (
      <PortalLayout portalLabel="Player portal">
        <Alert>
          <AlertTitle>Player profile not found</AlertTitle>
          <AlertDescription>Your account is not linked to a player record yet.</AlertDescription>
        </Alert>
      </PortalLayout>
    )
  }

  const headshotUrl = getHeadshotUrl({
    id: player.id,
    name: player.name,
    headshotUrl: undefined,
  })

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My profile</h1>
          <p className="text-sm text-muted-foreground">Update your public listing photo. Other profile fields are managed by your club captain.</p>
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
          onSaveUrl={(url) => {
            submitHeadshotForReview(player.id, player.name, KNCL_LEAGUE_ID, url)
          }}
          onUploadFile={async (file) => {
            await submitHeadshotFile(player.id, player.name, KNCL_LEAGUE_ID, file)
          }}
        />

        <Card>
          <CardHeader><CardTitle>{player.name}</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="federationId" render={({ field }) => (
                  <FormItem><FormLabel>Federation ID</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="nationality" render={({ field }) => (
                  <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="fideRating" render={({ field }) => (
                  <FormItem><FormLabel>FIDE rating</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
