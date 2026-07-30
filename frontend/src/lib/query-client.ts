import { QueryClient } from '@tanstack/react-query'

/** Reference lists (leagues, clubs) — 5 min fresh */
export const STALE_REFERENCE_MS = 5 * 60 * 1000

/** Portal bundle & domain lists — 2 min fresh */
export const STALE_PORTAL_MS = 2 * 60 * 1000

/** Auth session — 10 min fresh */
export const STALE_SESSION_MS = 10 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_PORTAL_MS,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})
