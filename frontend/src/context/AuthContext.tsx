import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchCurrentSession,
  loginWithPassword,
  mapSessionToUser,
} from '@/api/auth'
import { mockUsers } from '@/data/mockUsers'
import { roleHomeRoutes } from '@/constants/roles'
import {
  clearAuthSession,
  clearBearerToken,
  getAccessToken,
  hasApiSession,
  setDevMockUser,
  USE_API,
} from '@/lib/api-config'
import { queryKeys } from '@/lib/query-keys'
import { STALE_SESSION_MS } from '@/lib/query-client'
import { readSessionCache, writeSessionCache } from '@/lib/session-cache'
import type { MockUser, UserRole } from '@/types'

interface AuthContextValue {
  user: MockUser | null
  isAuthenticated: boolean
  loading: boolean
  accessToken: string | null
  allUsers: MockUser[]
  login: (user: MockUser) => void
  loginWithApi: (email: string, password: string) => Promise<MockUser>
  loginByEmail: (email: string) => MockUser | null
  logout: () => void
  switchRole: (role: UserRole) => void
  provisionUser: (user: MockUser) => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [devUserOverride, setDevUserOverride] = useState<MockUser | null>(null)
  const [provisionedUsers, setProvisionedUsers] = useState<MockUser[]>([])
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())

  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      if (!hasApiSession()) return null
      const session = await fetchCurrentSession()
      writeSessionCache(session)
      return session
    },
    enabled: USE_API,
    staleTime: STALE_SESSION_MS,
    placeholderData: () => readSessionCache(),
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false
      return !(error instanceof Error && error.message.includes('401'))
    },
  })

  const sessionUser = useMemo(
    () => (sessionQuery.data ? mapSessionToUser(sessionQuery.data) : null),
    [sessionQuery.data],
  )

  const user = devUserOverride ?? sessionUser

  const loading =
    USE_API &&
    hasApiSession() &&
    sessionQuery.isPending &&
    !sessionQuery.data &&
    !readSessionCache()

  const allUsers = useMemo(() => [...mockUsers, ...provisionedUsers], [provisionedUsers])

  const refreshSession = useCallback(async () => {
    if (!USE_API) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.session })
  }, [queryClient])

  const login = useCallback(
    (nextUser: MockUser) => {
      setDevUserOverride(nextUser)
      if (USE_API) {
        setDevMockUser(nextUser)
        setAccessTokenState(getAccessToken())
      }
    },
    [],
  )

  const loginWithApi = useCallback(
    async (email: string, password: string) => {
      await loginWithPassword(email, password)
      setDevUserOverride(null)
      setAccessTokenState(getAccessToken())
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      const session = await queryClient.fetchQuery({
        queryKey: queryKeys.session,
        queryFn: async () => {
          const next = await fetchCurrentSession()
          writeSessionCache(next)
          return next
        },
      })
      if (!session) {
        throw new Error('Signed in but could not load your profile.')
      }
      const profile = mapSessionToUser(session)
      await queryClient.invalidateQueries({ queryKey: ['portal'] })
      return profile
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    setDevUserOverride(null)
    clearAuthSession()
    writeSessionCache(null)
    setAccessTokenState(null)
    queryClient.removeQueries({ queryKey: queryKeys.session })
    queryClient.removeQueries({ queryKey: ['portal'] })
    queryClient.removeQueries({ queryKey: ['transfers'] })
    queryClient.removeQueries({ queryKey: ['applications'] })
    queryClient.removeQueries({ queryKey: ['seasons'] })
    queryClient.removeQueries({ queryKey: ['engagements'] })
    queryClient.removeQueries({ queryKey: ['roster-enrollments'] })
    queryClient.removeQueries({ queryKey: ['player-listings'] })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      accessToken,
      allUsers,
      login,
      loginWithApi,
      refreshSession,
      loginByEmail: (email) => {
        const normalized = email.trim().toLowerCase()
        return allUsers.find((u) => u.email.toLowerCase() === normalized) ?? null
      },
      logout,
      switchRole: (role) => {
        const match = allUsers.find((item) => item.role === role)
        if (match) login(match)
      },
      provisionUser: (nextUser) => {
        setProvisionedUsers((prev) => {
          const exists = prev.some((u) => u.email.toLowerCase() === nextUser.email.toLowerCase())
          if (exists) {
            return prev.map((u) =>
              u.email.toLowerCase() === nextUser.email.toLowerCase() ? { ...u, ...nextUser } : u,
            )
          }
          return [...prev, nextUser]
        })
      },
    }),
    [user, loading, allUsers, accessToken, login, loginWithApi, logout, refreshSession],
  )

  useEffect(() => {
    if (sessionQuery.isError && getAccessToken()) {
      clearBearerToken()
      setAccessTokenState(null)
    }
  }, [sessionQuery.isError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function getHomeRouteForUser(user: MockUser | null): string {
  if (!user) return '/login'
  return roleHomeRoutes[user.role]
}
