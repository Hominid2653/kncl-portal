import { useEffect, useState } from 'react'
import { CrownIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import PlayerRatingsBadges from '@/components/player-ratings'
import {
  confirmChesscomVerification,
  confirmLichessVerification,
  requestChesscomVerification,
  requestLichessVerification,
  syncChesscomRatings,
  syncFideRatings,
  syncLichessRatings,
  syncPlayerRatings,
  updatePlayerExternalAccounts,
  type VerificationCodeApiResponse,
} from '@/api/players'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { usePortalData } from '@/context/PortalDataContext'
import { hasAnyRating, ratingSourceLabel } from '@/lib/player-ratings'
import { USE_API } from '@/lib/api-config'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerAccountsPage() {
  const { user } = useAuth()
  const { playerById, refresh } = usePortalData()
  const { refreshListings } = usePlayerListings()
  const player = user?.playerId ? playerById(user.playerId) : undefined

  const [fideId, setFideId] = useState('')
  const [lichessUsername, setLichessUsername] = useState('')
  const [chesscomUsername, setChesscomUsername] = useState('')
  const [lichessCode, setLichessCode] = useState<VerificationCodeApiResponse | null>(null)
  const [chesscomCode, setChesscomCode] = useState<VerificationCodeApiResponse | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (player) {
      setFideId(player.fideId ?? '')
      setLichessUsername(player.lichessUsername ?? '')
      setChesscomUsername(player.chesscomUsername ?? '')
      setLichessCode(null)
      setChesscomCode(null)
    }
  }, [player?.id, player?.fideId, player?.lichessUsername, player?.chesscomUsername])

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

  const ratings = {
    classicalRating: player.classicalRating ?? player.fideRating,
    rapidRating: player.rapidRating,
    blitzRating: player.blitzRating,
    fideId: player.fideId,
    lichessUsername: player.lichessUsername,
    chesscomUsername: player.chesscomUsername,
  }

  const afterSync = async () => {
    await refresh()
    await refreshListings()
  }

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key)
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed.')
    } finally {
      setBusy(null)
    }
  }

  const handleSaveFideId = () =>
    run('fide-save', async () => {
      const trimmed = fideId.trim()
      if (!trimmed) {
        toast.error('Enter your FIDE ID.')
        return
      }
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to link your FIDE ID.')
        return
      }
      await updatePlayerExternalAccounts(player.id, { fide_id: trimmed }, { syncFide: true })
      await afterSync()
      toast.success('FIDE ID linked and ratings synced.')
    })

  const handleSaveLichessUsername = () =>
    run('lichess-save', async () => {
      const trimmed = lichessUsername.trim()
      if (!trimmed) {
        toast.error('Enter your Lichess username.')
        return
      }
      if (!USE_API) return
      await updatePlayerExternalAccounts(player.id, { lichess_username: trimmed }, { syncLichess: true })
      await afterSync()
      setLichessCode(null)
      toast.success('Lichess account linked. Ratings synced.')
    })

  const handleSaveChesscomUsername = () =>
    run('chesscom-save', async () => {
      const trimmed = chesscomUsername.trim()
      if (!trimmed) {
        toast.error('Enter your Chess.com username.')
        return
      }
      if (!USE_API) return
      await updatePlayerExternalAccounts(player.id, { chesscom_username: trimmed }, { syncChesscom: true })
      await afterSync()
      setChesscomCode(null)
      toast.success('Chess.com account linked. Ratings synced.')
    })

  const handleSmartSync = () =>
    run('smart-sync', async () => {
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to sync ratings.')
        return
      }
      await syncPlayerRatings(player.id)
      await afterSync()
      toast.success('Ratings synced from your primary linked account.')
    })

  const handleFideSync = () =>
    run('fide-sync', async () => {
      if (!USE_API || !player.fideId) return
      await syncFideRatings(player.id)
      await afterSync()
      toast.success('FIDE ratings synced.')
    })

  const handleLichessSync = () =>
    run('lichess-sync', async () => {
      if (!USE_API || !player.lichessUsername) return
      await syncLichessRatings(player.id)
      await afterSync()
      toast.success('Lichess ratings synced.')
    })

  const ensureLichessLinked = async () => {
    const trimmed = lichessUsername.trim()
    if (!trimmed) {
      throw new Error('Enter your Lichess username and link it before verifying.')
    }
    if (trimmed.toLowerCase() !== player.lichessUsername?.toLowerCase()) {
      await updatePlayerExternalAccounts(player.id, { lichess_username: trimmed }, { syncLichess: true })
      await afterSync()
      setLichessCode(null)
    }
  }

  const handleLichessRequestCode = () =>
    run('lichess-code', async () => {
      if (!USE_API) return
      await ensureLichessLinked()
      const result = await requestLichessVerification(player.id)
      if (result) {
        setLichessCode(result)
        toast.success('Add the code to your Lichess bio, save your profile, then confirm.')
      }
    })

  const handleLichessConfirm = () =>
    run('lichess-confirm', async () => {
      if (!USE_API) return
      if (!lichessCode) {
        throw new Error('Request a verification code before confirming.')
      }
      await confirmLichessVerification(player.id)
      await afterSync()
      setLichessCode(null)
      toast.success('Lichess account verified.')
    })

  const handleChesscomSync = () =>
    run('chesscom-sync', async () => {
      if (!USE_API || !player.chesscomUsername) return
      await syncChesscomRatings(player.id)
      await afterSync()
      toast.success('Chess.com ratings synced.')
    })

  const handleChesscomRequestCode = () =>
    run('chesscom-code', async () => {
      if (!USE_API || !player.chesscomUsername) return
      const result = await requestChesscomVerification(player.id)
      if (result) {
        setChesscomCode(result)
        toast.success('Add the code to your Chess.com bio, then confirm.')
      }
    })

  const handleChesscomConfirm = () =>
    run('chesscom-confirm', async () => {
      if (!USE_API) return
      await confirmChesscomVerification(player.id)
      await afterSync()
      setChesscomCode(null)
      toast.success('Chess.com account verified.')
    })

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Ratings &amp; external accounts</h1>
          <p className="text-muted-foreground">
            Link FIDE first for official ratings. If you have no FIDE ID, use Lichess or Chess.com instead.
          </p>
        </div>

        <Card className="overflow-hidden border-2 border-[#111b2e]/10">
          <div className="bg-[#111b2e] px-6 py-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">Current ratings</p>
                <p className="mt-1 text-sm text-white/75">Source: {ratingSourceLabel(ratings)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                disabled={busy !== null}
                onClick={handleSmartSync}
              >
                <RefreshCwIcon className="size-4" data-icon="inline-start" />
                {busy === 'smart-sync' ? 'Syncing…' : 'Sync all'}
              </Button>
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            {hasAnyRating(ratings) ? (
              <PlayerRatingsBadges ratings={ratings} />
            ) : (
              <p className="text-sm text-muted-foreground">No ratings synced yet. Link an account below.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Synced ratings appear on your dashboard and in public player listings.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="fide" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 p-1">
            <TabsTrigger value="fide" className="gap-2 py-2.5">
              <CrownIcon className="size-4" />
              FIDE
            </TabsTrigger>
            <TabsTrigger value="lichess" className="py-2.5">Lichess</TabsTrigger>
            <TabsTrigger value="chesscom" className="py-2.5">Chess.com</TabsTrigger>
          </TabsList>

          <TabsContent value="fide">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CrownIcon className="size-5 text-kenya-green" />
                  FIDE ID
                  {player.fideId && <Badge variant="secondary">Linked</Badge>}
                </CardTitle>
                <CardDescription>
                  Official FIDE standard, rapid, and blitz ratings from ratings.fide.com.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="fide-id">FIDE ID (4–10 digits)</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="fide-id"
                      inputMode="numeric"
                      placeholder="e.g. 1503014"
                      value={fideId}
                      onChange={(e) => setFideId(e.target.value)}
                      disabled={busy !== null}
                      className="sm:max-w-xs"
                    />
                    <Button disabled={busy !== null || !fideId.trim()} onClick={handleSaveFideId}>
                      {busy === 'fide-save' ? 'Saving…' : player.fideId ? 'Update & sync' : 'Link & sync'}
                    </Button>
                  </div>
                </div>
                {player.fideId && (
                  <Button variant="outline" disabled={busy !== null} onClick={handleFideSync}>
                    {busy === 'fide-sync' ? 'Syncing…' : 'Refresh FIDE ratings'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lichess">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  Lichess
                  {player.lichessUsername && <Badge variant="outline">{player.lichessUsername}</Badge>}
                  <Badge variant={player.lichessVerified ? 'secondary' : 'outline'}>
                    {player.lichessVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </CardTitle>
                <CardDescription>Use when you do not have a FIDE ID, or to verify your online account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="lichess-username">Username</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="lichess-username"
                      placeholder="your_lichess_handle"
                      value={lichessUsername}
                      onChange={(e) => {
                        setLichessUsername(e.target.value)
                        setLichessCode(null)
                      }}
                      disabled={busy !== null}
                      className="sm:max-w-xs"
                    />
                    <Button disabled={busy !== null || !lichessUsername.trim()} onClick={handleSaveLichessUsername}>
                      {busy === 'lichess-save' ? 'Saving…' : player.lichessUsername ? 'Update & sync' : 'Link & sync'}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!player.lichessUsername || busy !== null} onClick={handleLichessSync}>
                    Sync ratings
                  </Button>
                  <Button variant="outline" disabled={!lichessUsername.trim() || busy !== null} onClick={handleLichessRequestCode}>
                    <ShieldCheckIcon className="size-4" data-icon="inline-start" />
                    Verify ownership
                  </Button>
                  {lichessCode && (
                    <Button disabled={busy !== null} onClick={handleLichessConfirm}>
                      Confirm verification
                    </Button>
                  )}
                </div>
                {lichessCode && (
                  <Alert>
                    <AlertTitle>Verification code</AlertTitle>
                    <AlertDescription>
                      Add <strong>{lichessCode.verification_code}</strong> to your Lichess profile bio, save the profile, then confirm.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chesscom">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  Chess.com
                  {player.chesscomUsername && <Badge variant="outline">{player.chesscomUsername}</Badge>}
                  <Badge variant={player.chesscomVerified ? 'secondary' : 'outline'}>
                    {player.chesscomVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </CardTitle>
                <CardDescription>Alternative rating source when FIDE is not available.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="chesscom-username">Username</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="chesscom-username"
                      placeholder="your_chesscom_handle"
                      value={chesscomUsername}
                      onChange={(e) => setChesscomUsername(e.target.value)}
                      disabled={busy !== null}
                      className="sm:max-w-xs"
                    />
                    <Button disabled={busy !== null || !chesscomUsername.trim()} onClick={handleSaveChesscomUsername}>
                      {busy === 'chesscom-save' ? 'Saving…' : player.chesscomUsername ? 'Update & sync' : 'Link & sync'}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!player.chesscomUsername || busy !== null} onClick={handleChesscomSync}>
                    Sync ratings
                  </Button>
                  <Button variant="outline" disabled={!player.chesscomUsername || busy !== null} onClick={handleChesscomRequestCode}>
                    <ShieldCheckIcon className="size-4" data-icon="inline-start" />
                    Verify ownership
                  </Button>
                  {chesscomCode && (
                    <Button disabled={busy !== null} onClick={handleChesscomConfirm}>
                      Confirm verification
                    </Button>
                  )}
                </div>
                {chesscomCode && (
                  <Alert>
                    <AlertTitle>Verification code</AlertTitle>
                    <AlertDescription>
                      Add <strong>{chesscomCode.verification_code}</strong> to your Chess.com profile bio, then confirm.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  )
}
