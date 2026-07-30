import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { seasons as initialSeasons } from '@/data/mockData'
import type { SeasonRecord } from '@/types'

interface SeasonContextValue {
  seasons: SeasonRecord[]
  getSeasonForLeague: (leagueId: string) => SeasonRecord | undefined
  isTransferWindowOpen: (leagueId: string) => boolean
  isRegistrationWindowOpen: (leagueId: string) => boolean
  canModifyRoster: (leagueId: string, clubInInitialRosterPeriod: boolean) => boolean
  toggleTransfers: (seasonId: string, open: boolean) => void
  toggleRegistration: (seasonId: string, open: boolean) => void
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

function latestSeasonForLeague(list: SeasonRecord[], leagueId: string) {
  return [...list].filter((s) => s.leagueId === leagueId).sort((a, b) => b.year - a.year)[0]
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<SeasonRecord[]>(initialSeasons)

  const value = useMemo<SeasonContextValue>(
    () => ({
      seasons,
      getSeasonForLeague: (leagueId) => latestSeasonForLeague(seasons, leagueId),
      isTransferWindowOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.transfersOpen ?? false,
      isRegistrationWindowOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.registrationOpen ?? false,
      canModifyRoster: (leagueId, clubInInitialRosterPeriod) =>
        clubInInitialRosterPeriod || (latestSeasonForLeague(seasons, leagueId)?.transfersOpen ?? false),
      toggleTransfers: (seasonId, open) => {
        setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, transfersOpen: open } : s)))
        toast.success(open ? 'Transfer window opened for league (mock)' : 'Transfer window closed for league (mock)')
      },
      toggleRegistration: (seasonId, open) => {
        setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, registrationOpen: open } : s)))
        toast.success(open ? 'Registration window opened for league (mock)' : 'Registration window closed for league (mock)')
      },
    }),
    [seasons],
  )

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

export function useSeason() {
  const context = useContext(SeasonContext)
  if (!context) throw new Error('useSeason must be used within SeasonProvider')
  return context
}
