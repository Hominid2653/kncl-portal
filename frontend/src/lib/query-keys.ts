import type { UserRole } from '@/types'

export const queryKeys = {
  session: ['auth', 'session'] as const,
  portal: (userId?: string | null, role?: UserRole | null) =>
    ['portal', 'bundle', userId ?? 'anon', role ?? 'none'] as const,
  transfers: ['transfers', 'list'] as const,
  seasons: ['seasons', 'list'] as const,
  clubApplications: ['applications', 'clubs'] as const,
  playerApplications: ['applications', 'players'] as const,
  engagements: ['engagements', 'list'] as const,
  rosterEnrollments: ['roster-enrollments', 'list'] as const,
  playerListings: ['player-listings', 'list'] as const,
  pendingHeadshots: ['players', 'headshots', 'pending'] as const,
}
