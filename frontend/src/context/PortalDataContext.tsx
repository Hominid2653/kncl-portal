import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/context/AuthContext'
import { USE_API } from '@/lib/api-config'
import { queryKeys } from '@/lib/query-keys'
import { STALE_REFERENCE_MS } from '@/lib/query-client'
import {
  emptyPortalBundle,
  fetchPortalBundle,
  mockPortalBundle,
  type PortalBundle,
} from '@/services/portal-bundle'
import type { ClubRecord, PlayerRecord } from '@/types'

interface PortalDataContextValue extends PortalBundle {
  loading: boolean
  isRefreshing: boolean
  refresh: () => Promise<void>
  clubById: (id: string) => ClubRecord | undefined
  playerById: (id: string) => PlayerRecord | undefined
  seasonNameById: (id: string) => string
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

const mockBundle = mockPortalBundle

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const portalQuery = useQuery({
    queryKey: queryKeys.portal(user?.id, user?.role),
    queryFn: () => fetchPortalBundle(user),
    enabled: USE_API && !authLoading,
    staleTime: STALE_REFERENCE_MS,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
  })

  const bundle: PortalBundle = USE_API
    ? (portalQuery.data ?? emptyPortalBundle)
    : mockBundle

  const loading = USE_API && !authLoading && portalQuery.isPending && !portalQuery.data
  const isRefreshing = USE_API && portalQuery.isFetching && !portalQuery.isPending

  const refresh = useCallback(async () => {
    if (!USE_API) return
    await queryClient.invalidateQueries({ queryKey: ['portal'] })
  }, [queryClient])

  const value = useMemo<PortalDataContextValue>(
    () => ({
      ...bundle,
      loading,
      isRefreshing,
      refresh,
      clubById: (id) => bundle.clubs.find((c) => c.id === id),
      playerById: (id) => bundle.players.find((p) => p.id === id),
      seasonNameById: (id) => bundle.seasonNames[id] ?? 'Season',
    }),
    [bundle, loading, isRefreshing, refresh],
  )

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>
}

export function usePortalData() {
  const context = useContext(PortalDataContext)
  if (!context) throw new Error('usePortalData must be used within PortalDataProvider')
  return context
}

/** True when portal lists have no rows yet and the initial fetch is in flight. */
export function usePortalListLoading(itemCount: number) {
  const { loading } = usePortalData()
  return loading && itemCount === 0
}
