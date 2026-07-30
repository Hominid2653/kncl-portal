import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { players } from '@/data/mockData'
import PortalLayout from '@/layouts/PortalLayout'

export default function PlayerAccountsPage() {
  const player = players[0]
  return (
    <PortalLayout portalLabel="Player portal">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold">External accounts</h1><p className="text-sm text-muted-foreground">Link and verify your Lichess and Chess.com profiles.</p></div>
        <Alert className="border-l-4 border-l-kenya-green">
          <AlertTitle>Lichess verification</AlertTitle>
          <AlertDescription>Add the verification code to your Lichess profile bio, then click Confirm.</AlertDescription>
        </Alert>
        <Tabs defaultValue="lichess">
          <TabsList><TabsTrigger value="lichess">Lichess</TabsTrigger><TabsTrigger value="chesscom">Chess.com</TabsTrigger></TabsList>
          <TabsContent value="lichess">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">{player.lichessUsername ?? 'Not linked'} <Badge variant={player.lichessVerified ? 'secondary' : 'outline'}>{player.lichessVerified ? 'Verified' : 'Unverified'}</Badge></CardTitle>
                <CardDescription>Sync ratings and verify account ownership.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={() => toast.success('Lichess synced (mock)')}>Sync ratings</Button>
                <Button variant="outline" onClick={() => toast.success('Verification code: KNCL-482910 (mock)')}>Get verify code</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chesscom">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">{player.chesscomUsername ?? 'Not linked'} <Badge variant={player.chesscomVerified ? 'secondary' : 'outline'}>{player.chesscomVerified ? 'Verified' : 'Unverified'}</Badge></CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={() => toast.success('Chess.com synced (mock)')}>Sync ratings</Button>
                <Button variant="outline" onClick={() => toast.success('Verification initiated (mock)')}>Verify account</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  )
}
