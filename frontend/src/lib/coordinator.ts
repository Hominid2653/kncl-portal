import type { MockUser } from '@/types'

const KNCL_LEAGUE_ID = '11111111-1111-4111-8111-111111111101'

export function canAccessLeague(user: MockUser | null, leagueId: string): boolean {
  if (!user) return false
  if (user.role === 'FEDERATION_ADMIN') return true
  if (user.role === 'LEAGUE_COORDINATOR') {
    return (user.leagueIds ?? [KNCL_LEAGUE_ID]).includes(leagueId)
  }
  return false
}

export function filterByLeagueScope<T extends { leagueId: string }>(user: MockUser | null, items: T[]): T[] {
  if (!user || user.role === 'FEDERATION_ADMIN') return items
  if (user.role === 'LEAGUE_COORDINATOR') {
    const allowed = user.leagueIds ?? [KNCL_LEAGUE_ID]
    return items.filter((item) => allowed.includes(item.leagueId))
  }
  return []
}

export function getClubLeagueId(clubId?: string): string {
  // Nairobi / Mombasa / Kisumu clubs are in KNCL for mock data
  void clubId
  return KNCL_LEAGUE_ID
}

export { KNCL_LEAGUE_ID }
