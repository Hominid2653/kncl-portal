import { useState } from 'react'
import { toast } from 'sonner'

import {
  confirmChesscomVerification,
  confirmLichessVerification,
  requestChesscomVerification,
  requestLichessVerification,
  syncChesscomRatings,
  syncLichessRatings,
  type VerificationCodeApiResponse,
} from '@/api/players'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { usePortalData } from '@/context/PortalDataContext'
import { USE_API } from '@/lib/api-config'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerAccountsPage() {
  const { user } = useAuth()
  const { playerById, refresh } = usePortalData()
  const player = user?.playerId ? playerById(user.playerId) : undefined
  const [lichessCode, setLichessCode] = useState<VerificationCodeApiResponse | null>(null)
  const [chesscomCode, setChesscomCode] = useState<VerificationCodeApiResponse | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

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

  const handleLichessSync = () =>
    run('lichess-sync', async () => {
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to sync ratings from Lichess.')
        return
      }
      await syncLichessRatings(player.id)
      await refresh()
      toast.success('Lichess ratings synced.')
    })

  const handleLichessRequestCode = () =>
    run('lichess-code', async () => {
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to request a verification code.')
        return
      }
      const result = await requestLichessVerification(player.id)
      if (result) {
        setLichessCode(result)
        toast.success('Verification code generated. Add it to your Lichess bio, then confirm.')
      }
    })

  const handleLichessConfirm = () =>
    run('lichess-confirm', async () => {
      if (!USE_API) return
      await confirmLichessVerification(player.id)
      await refresh()
      setLichessCode(null)
      toast.success('Lichess account verified.')
    })

  const handleChesscomSync = () =>
    run('chesscom-sync', async () => {
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to sync ratings from Chess.com.')
        return
      }
      await syncChesscomRatings(player.id)
      await refresh()
      toast.success('Chess.com ratings synced.')
    })

  const handleChesscomRequestCode = () =>
    run('chesscom-code', async () => {
      if (!USE_API) {
        toast.message('Enable VITE_USE_API to request a verification code.')
        return
      }
      const result = await requestChesscomVerification(player.id)
      if (result) {
        setChesscomCode(result)
        toast.success('Verification code generated. Add it to your Chess.com bio, then confirm.')
      }
    })

  const handleChesscomConfirm = () =>
    run('chesscom-confirm', async () => {
      if (!USE_API) return
      await confirmChesscomVerification(player.id)
      await refresh()
      setChesscomCode(null)
      toast.success('Chess.com account verified.')
    })

  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">External accounts</h1>
          <p className="text-sm text-muted-foreground">Link and verify your Lichess and Chess.com profiles.</p>
        </div>
        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Verification workflow</AlertTitle>
          <AlertDescription>
            Your club captain links usernames on your player record. Request a code, add it to your profile bio, then confirm ownership.
          </AlertDescription>
        </Alert>
        <Tabs defaultValue="lichess">
          <TabsList>
            <TabsTrigger value="lichess">Lichess</TabsTrigger>
            <TabsTrigger value="chesscom">Chess.com</TabsTrigger>
          </TabsList>
          <TabsContent value="lichess">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {player.lichessUsername ?? 'Not linked'}
                  <Badge variant={player.lichessVerified ? 'secondary' : 'outline'}>
                    {player.lichessVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </CardTitle>
                <CardDescription>Sync ratings and verify account ownership.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!player.lichessUsername && (
                  <Alert>
                    <AlertDescription>Ask your club captain to add your Lichess username before syncing or verifying.</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!player.lichessUsername || busy !== null} onClick={handleLichessSync}>
                    {busy === 'lichess-sync' ? 'Syncing…' : 'Sync ratings'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!player.lichessUsername || busy !== null}
                    onClick={handleLichessRequestCode}
                  >
                    {busy === 'lichess-code' ? 'Requesting…' : 'Get verify code'}
                  </Button>
                  {lichessCode && (
                    <Button disabled={busy !== null} onClick={handleLichessConfirm}>
                      {busy === 'lichess-confirm' ? 'Confirming…' : 'Confirm verification'}
                    </Button>
                  )}
                </div>
                {lichessCode && (
                  <Alert>
                    <AlertTitle>Verification code</AlertTitle>
                    <AlertDescription>
                      Add <strong>{lichessCode.verification_code}</strong> to your Lichess profile bio, then click Confirm verification.
                      {lichessCode.instructions ? ` ${lichessCode.instructions}` : ''}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chesscom">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {player.chesscomUsername ?? 'Not linked'}
                  <Badge variant={player.chesscomVerified ? 'secondary' : 'outline'}>
                    {player.chesscomVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </CardTitle>
                <CardDescription>Sync ratings and verify account ownership.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!player.chesscomUsername && (
                  <Alert>
                    <AlertDescription>Ask your club captain to add your Chess.com username before syncing or verifying.</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!player.chesscomUsername || busy !== null} onClick={handleChesscomSync}>
                    {busy === 'chesscom-sync' ? 'Syncing…' : 'Sync ratings'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!player.chesscomUsername || busy !== null}
                    onClick={handleChesscomRequestCode}
                  >
                    {busy === 'chesscom-code' ? 'Requesting…' : 'Get verify code'}
                  </Button>
                  {chesscomCode && (
                    <Button disabled={busy !== null} onClick={handleChesscomConfirm}>
                      {busy === 'chesscom-confirm' ? 'Confirming…' : 'Confirm verification'}
                    </Button>
                  )}
                </div>
                {chesscomCode && (
                  <Alert>
                    <AlertTitle>Verification code</AlertTitle>
                    <AlertDescription>
                      Add <strong>{chesscomCode.verification_code}</strong> to your Chess.com profile bio, then click Confirm verification.
                      {chesscomCode.instructions ? ` ${chesscomCode.instructions}` : ''}
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
