import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { seasons as initialSeasons } from '@/data/mockData'
import type { SeasonRecord } from '@/types'

interface SeasonContextValue {
  seasons: SeasonRecord[]
  getSeasonForLeague: (leagueId: string) => SeasonRecord | undefined
  isTransferWindowOpen: (leagueId: string) => boolean
  isRosterEnrollmentOpen: (leagueId: string) => boolean
  /** @deprecated Use isRosterEnrollmentOpen */
  isRegistrationWindowOpen: (leagueId: string) => boolean
  canModifyRoster: (leagueId: string, clubInInitialRosterPeriod: boolean) => boolean
  toggleTransfers: (seasonId: string, open: boolean) => void
  toggleRosterEnrollment: (seasonId: string, open: boolean) => void
  /** @deprecated Use toggleRosterEnrollment */
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
      isRosterEnrollmentOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.rosterEnrollmentOpen ?? false,
      isRegistrationWindowOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.rosterEnrollmentOpen ?? false,
      canModifyRoster: (leagueId, clubInInitialRosterPeriod) =>
        clubInInitialRosterPeriod || (latestSeasonForLeague(seasons, leagueId)?.transfersOpen ?? false),
      toggleTransfers: (seasonId, open) => {
        setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, transfersOpen: open } : s)))
        toast.success(open ? 'Transfer window opened for league (mock)' : 'Transfer window closed for league (mock)')
      },
      toggleRosterEnrollment: (seasonId, open) => {
        setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, rosterEnrollmentOpen: open } : s)))
        toast.success(open ? 'Roster enrollment opened for league (mock)' : 'Roster enrollment closed for league (mock)')
      },
      toggleRegistration: (seasonId, open) => {
        setSeasons((prev) => prev.map((s) => (s.id === seasonId ? { ...s, rosterEnrollmentOpen: open } : s)))
        toast.success(open ? 'Roster enrollment opened for league (mock)' : 'Roster enrollment closed for league (mock)')
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
