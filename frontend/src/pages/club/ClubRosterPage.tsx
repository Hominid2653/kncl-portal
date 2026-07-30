import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataTable } from '@/components/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useSeason } from '@/context/SeasonContext'
import { clubs, clubMembers } from '@/data/mockData'
import { getClubLeagueId } from '@/lib/coordinator'
import type { ClubMemberRecord } from '@/types'
import { MIN_ROSTER_SIZE } from '@/lib/business-rules'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<ClubMemberRecord, unknown>[] = [
  { accessorKey: 'playerName', header: 'Player' },
  { accessorKey: 'position', header: 'Position' },
  { accessorKey: 'joinedAt', header: 'Joined' },
]

export default function ClubRosterPage() {
  const { user } = useAuth()
  const { isClubInInitialRosterPeriod, getClubRosterCount } = useOnboarding()
  const { canModifyRoster, getSeasonForLeague } = useSeason()

  const club = clubs.find((c) => c.id === user?.clubId)
  const leagueId = club?.leagueId ?? getClubLeagueId(user?.clubId)
  const season = getSeasonForLeague(leagueId)
  const inInitialPeriod = user?.clubId ? isClubInInitialRosterPeriod(user.clubId) : false
  const rosterCount = user?.clubId ? getClubRosterCount(user.clubId) : 0

  const canAdd = canModifyRoster(leagueId, inInitialPeriod)

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Roster</h1>
            <p className="text-sm text-muted-foreground">Add free agents during transfer windows or your initial roster period.</p>
          </div>
          <Button render={<Link to="/club/players/new" />} disabled={!canAdd}>
            <PlusIcon data-icon="inline-start" />
            Add free agent
          </Button>
        </div>

        {inInitialPeriod && (
          <Alert className="border-l-4 border-l-kenya-green">
            <AlertTitle>Initial roster period active ({rosterCount}/{MIN_ROSTER_SIZE})</AlertTitle>
            <AlertDescription>
              Build your first squad from free agents. This period ends automatically when you reach {MIN_ROSTER_SIZE} approved roster members.
            </AlertDescription>
          </Alert>
        )}

        <Alert className={canAdd ? 'border-l-4 border-l-kenya-green' : undefined} variant={canAdd ? 'default' : 'destructive'}>
          <AlertTitle>
            {canAdd
              ? inInitialPeriod
                ? 'Roster changes allowed (initial period)'
                : `Transfer window open — ${season?.name ?? 'Current season'}`
              : 'Roster changes locked'}
          </AlertTitle>
          <AlertDescription>
            {canAdd
              ? 'Add players from the free agent pool via engagement and transfer workflows.'
              : `Transfer window is closed for ${season?.leagueName ?? 'your league'}. Wait for the coordinator to open it.`}
          </AlertDescription>
        </Alert>

        <DataTable columns={columns} data={clubMembers} searchKey="playerName" searchPlaceholder="Search roster..." />
      </div>
    </PortalLayout>
  )
}
