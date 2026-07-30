import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { mockUsers } from '@/data/mockUsers'
import { roleHomeRoutes } from '@/constants/roles'
import type { MockUser, UserRole } from '@/types'

interface AuthContextValue {
  user: MockUser | null
  isAuthenticated: boolean
  allUsers: MockUser[]
  login: (user: MockUser) => void
  loginByEmail: (email: string) => MockUser | null
  logout: () => void
  switchRole: (role: UserRole) => void
  provisionUser: (user: MockUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [provisionedUsers, setProvisionedUsers] = useState<MockUser[]>([])

  const allUsers = useMemo(() => [...mockUsers, ...provisionedUsers], [provisionedUsers])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      allUsers,
      login: (nextUser) => setUser(nextUser),
      loginByEmail: (email) => {
        const normalized = email.trim().toLowerCase()
        return allUsers.find((u) => u.email.toLowerCase() === normalized) ?? null
      },
      logout: () => setUser(null),
      switchRole: (role) => {
        const match = allUsers.find((item) => item.role === role)
        if (match) setUser(match)
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
    [user, allUsers, provisionedUsers],
  )

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
