import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { listSeasons, patchSeason } from '@/api/seasons'
import { useAuth } from '@/context/AuthContext'
import { seasons as initialSeasons } from '@/data/mockData'
import { USE_API, hasApiSession } from '@/lib/api-config'
import { queryKeys } from '@/lib/query-keys'
import { STALE_REFERENCE_MS } from '@/lib/query-client'
import type { SeasonRecord } from '@/types'

interface SeasonContextValue {
  seasons: SeasonRecord[]
  loading: boolean
  getSeasonForLeague: (leagueId: string) => SeasonRecord | undefined
  isTransferWindowOpen: (leagueId: string) => boolean
  isRosterEnrollmentOpen: (leagueId: string) => boolean
  isRegistrationWindowOpen: (leagueId: string) => boolean
  canModifyRoster: (leagueId: string, clubInInitialRosterPeriod: boolean) => boolean
  toggleTransfers: (seasonId: string, open: boolean) => void
  toggleRosterEnrollment: (seasonId: string, open: boolean) => void
  toggleRegistration: (seasonId: string, open: boolean) => void
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

function latestSeasonForLeague(list: SeasonRecord[], leagueId: string) {
  return [...list].filter((s) => s.leagueId === leagueId).sort((a, b) => b.year - a.year)[0]
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const seasonsQuery = useQuery({
    queryKey: queryKeys.seasons,
    queryFn: async () => {
      const response = await listSeasons(accessToken)
      if (!response?.items) return []
      return response.items.map((season) => ({
        id: season.id,
        leagueId: season.league_id,
        leagueName: 'League',
        name: season.name,
        year: season.year,
        rosterEnrollmentOpen: season.roster_enrollment_open,
        transfersOpen: season.transfers_open,
      }))
    },
    enabled: USE_API && !authLoading && Boolean(user) && hasApiSession(),
    staleTime: STALE_REFERENCE_MS,
    placeholderData: (previous) => previous,
  })

  const seasons = USE_API ? (seasonsQuery.data ?? []) : initialSeasons
  const loading = USE_API && seasonsQuery.isPending && !seasonsQuery.data

  const value = useMemo<SeasonContextValue>(
    () => ({
      seasons,
      loading,
      getSeasonForLeague: (leagueId) => latestSeasonForLeague(seasons, leagueId),
      isTransferWindowOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.transfersOpen ?? false,
      isRosterEnrollmentOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.rosterEnrollmentOpen ?? false,
      isRegistrationWindowOpen: (leagueId) => latestSeasonForLeague(seasons, leagueId)?.rosterEnrollmentOpen ?? false,
      canModifyRoster: (leagueId, clubInInitialRosterPeriod) =>
        clubInInitialRosterPeriod || (latestSeasonForLeague(seasons, leagueId)?.transfersOpen ?? false),
      toggleTransfers: (seasonId, open) => {
        if (USE_API) {
          queryClient.setQueryData<SeasonRecord[]>(queryKeys.seasons, (prev) =>
            (prev ?? []).map((s) => (s.id === seasonId ? { ...s, transfersOpen: open } : s)),
          )
          void patchSeason(seasonId, { transfers_open: open }, accessToken)
            .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.seasons }))
            .catch(() => {
              toast.error('Failed to update transfer window on server.')
              void queryClient.invalidateQueries({ queryKey: queryKeys.seasons })
            })
        }
        toast.success(open ? 'Transfer window opened for league' : 'Transfer window closed for league')
      },
      toggleRosterEnrollment: (seasonId, open) => {
        if (USE_API) {
          queryClient.setQueryData<SeasonRecord[]>(queryKeys.seasons, (prev) =>
            (prev ?? []).map((s) => (s.id === seasonId ? { ...s, rosterEnrollmentOpen: open } : s)),
          )
          void patchSeason(seasonId, { roster_enrollment_open: open }, accessToken)
            .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.seasons }))
            .catch(() => {
              toast.error('Failed to update roster enrollment window on server.')
              void queryClient.invalidateQueries({ queryKey: queryKeys.seasons })
            })
        }
        toast.success(open ? 'Roster enrollment opened for league' : 'Roster enrollment closed for league')
      },
      toggleRegistration: (seasonId, open) => {
        if (USE_API) {
          queryClient.setQueryData<SeasonRecord[]>(queryKeys.seasons, (prev) =>
            (prev ?? []).map((s) => (s.id === seasonId ? { ...s, rosterEnrollmentOpen: open } : s)),
          )
          void patchSeason(seasonId, { roster_enrollment_open: open }, accessToken)
            .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.seasons }))
            .catch(() => {
              toast.error('Failed to update roster enrollment window on server.')
              void queryClient.invalidateQueries({ queryKey: queryKeys.seasons })
            })
        }
        toast.success(open ? 'Roster enrollment opened for league' : 'Roster enrollment closed for league')
      },
    }),
    [seasons, loading, accessToken, queryClient],
  )

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

export function useSeason() {
  const context = useContext(SeasonContext)
  if (!context) throw new Error('useSeason must be used within SeasonProvider')
  return context
}
