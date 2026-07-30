import type { UserRole } from '@/types'

export const roleLabels: Record<UserRole, string> = {
  PLAYER: 'Player',
  CLUB_ADMIN: 'Club Captain',
  LEAGUE_COORDINATOR: 'League Coordinator',
  FEDERATION_ADMIN: 'Federation Official',
}

export const roleHomeRoutes: Record<UserRole, string> = {
  PLAYER: '/player',
  CLUB_ADMIN: '/club',
  LEAGUE_COORDINATOR: '/admin',
  FEDERATION_ADMIN: '/admin',
}

export const portalLabels: Record<UserRole, string> = {
  PLAYER: 'Player portal',
  CLUB_ADMIN: 'Club portal',
  LEAGUE_COORDINATOR: 'Admin portal',
  FEDERATION_ADMIN: 'Admin portal',
}

export const leagueLeadershipRoles: UserRole[] = ['LEAGUE_COORDINATOR', 'FEDERATION_ADMIN']
export const clubLeadershipRoles: UserRole[] = ['CLUB_ADMIN', 'LEAGUE_COORDINATOR', 'FEDERATION_ADMIN']
export const federationAdminRoles: UserRole[] = ['FEDERATION_ADMIN']

export function hasRole(userRole: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(userRole)
}
