import type { EngagementApiRecord } from '@/api/engagements'
import type {
  ApiClub,
  ApiDocument,
  ApiLeague,
  ApiNotification,
  ApiPlayer,
  ApiRegistration,
  ApiTransfer,
  ApiUserProfile,
  ApiClubMember,
  ApiAuditLog,
  ApiActivityItem,
} from '@/api/resources'
import type {
  AuditLogRecord,
  ClubMemberRecord,
  ClubRecord,
  DashboardStat,
  DocumentRecord,
  EngagementRequest,
  LeagueRecord,
  NotificationRecord,
  PlayerRecord,
  RosterEnrollmentRecord,
  TransferRecord,
  UserProfileRecord,
  UserRole,
} from '@/types'

export function formatApiDate(value: string): string {
  try {
    return new Date(value).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function mapLeague(item: ApiLeague): LeagueRecord {
  return { id: item.id, name: item.name, description: item.description ?? '' }
}

export function mapClub(item: ApiClub, leagueName?: string): ClubRecord {
  return {
    id: item.id,
    name: item.name,
    league: leagueName ?? 'League',
    leagueId: item.league_id,
    county: item.county ?? '',
    players: item.approved_roster_count ?? 0,
    initialRosterPeriod: item.initial_roster_period_active,
  }
}

export function playerDisplayName(
  player: ApiPlayer,
  profiles: Map<string, ApiUserProfile>,
): string {
  const profile = profiles.get(player.user_profile_id)
  if (profile) return `${profile.first_name} ${profile.last_name}`.trim()
  return player.federation_id ?? `Player ${player.id.slice(0, 8)}`
}

export function mapPlayer(
  item: ApiPlayer,
  profiles: Map<string, ApiUserProfile>,
  clubs: Map<string, ApiClub>,
  registrations: ApiRegistration[],
): PlayerRecord {
  const reg = registrations.find((r) => r.player_id === item.id && r.status === 'APPROVED')
  const club = reg ? clubs.get(reg.club_id) : undefined
  return {
    id: item.id,
    federationId: item.federation_id ?? '',
    name: playerDisplayName(item, profiles),
    club: club?.name ?? '—',
    clubId: reg?.club_id ?? '',
    fideRating: item.classical_rating ?? undefined,
    lichessUsername: item.lichess_username ?? undefined,
    chesscomUsername: item.chesscom_username ?? undefined,
    lichessVerified: item.lichess_verified ?? false,
    chesscomVerified: item.chesscom_verified ?? false,
    nationality: item.nationality ?? '',
  }
}

export function mapClubMember(
  item: ApiClubMember,
  profiles: Map<string, ApiUserProfile>,
  clubs: Map<string, ApiClub>,
): ClubMemberRecord {
  const profile = profiles.get(item.user_profile_id)
  const club = clubs.get(item.club_id)
  return {
    id: item.id,
    playerName: profile ? `${profile.first_name} ${profile.last_name}` : 'Member',
    club: club?.name ?? '—',
    position: item.position,
    joinedAt: item.created_at ? formatApiDate(item.created_at) : '—',
  }
}

export function mapRegistration(
  item: ApiRegistration,
  players: Map<string, ApiPlayer>,
  profiles: Map<string, ApiUserProfile>,
  clubs: Map<string, ApiClub>,
  seasons: Map<string, { name: string }>,
): RosterEnrollmentRecord {
  const player = players.get(item.player_id)
  const club = clubs.get(item.club_id)
  const season = seasons.get(item.season_id)
  return {
    id: item.id,
    playerId: item.player_id,
    playerName: player ? playerDisplayName(player, profiles) : 'Player',
    clubId: item.club_id,
    club: club?.name ?? '—',
    season: season?.name ?? 'Season',
    status: item.status as RosterEnrollmentRecord['status'],
    submittedAt: formatApiDate(item.registered_at),
  }
}

export function mapTransfer(
  item: ApiTransfer,
  players: Map<string, ApiPlayer>,
  profiles: Map<string, ApiUserProfile>,
  clubs: Map<string, ApiClub>,
): TransferRecord {
  const player = item.player_id ? players.get(item.player_id) : undefined
  return {
    id: item.id,
    playerId: item.player_id ?? undefined,
    playerName: player ? playerDisplayName(player, profiles) : 'Player',
    fromClubId: item.from_club_id,
    fromClub: clubs.get(item.from_club_id)?.name ?? '—',
    toClubId: item.to_club_id,
    toClub: clubs.get(item.to_club_id)?.name ?? '—',
    status: item.status as TransferRecord['status'],
    submittedAt: formatApiDate(item.submitted_at),
    reason: item.reason ?? undefined,
    engagementId: item.engagement_id ?? undefined,
    source: item.source as TransferRecord['source'],
  }
}

export function mapNotification(item: ApiNotification): NotificationRecord {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    read: item.is_read,
    createdAt: formatApiDate(item.created_at),
  }
}

export function mapDocument(item: ApiDocument): DocumentRecord {
  return {
    id: item.id,
    title: item.file_name ?? item.document_type ?? 'Document',
    type: item.document_type ?? 'file',
    linkedTo: `Transfer ${item.transfer_id.slice(0, 8)}`,
    uploadedAt: formatApiDate(item.uploaded_at),
  }
}

export function mapAuditLog(
  item: ApiAuditLog,
  profiles: Map<string, ApiUserProfile>,
): AuditLogRecord {
  const profile = profiles.get(item.user_profile_id)
  const actor = profile ? `${profile.first_name} ${profile.last_name}` : 'System'
  return {
    id: item.id,
    action: item.action,
    entity: item.entity,
    actor,
    createdAt: formatApiDate(item.created_at),
  }
}

export function mapActivityLog(
  item: ApiActivityItem,
): AuditLogRecord {
  return {
    id: item.id,
    action: item.action,
    entity: item.summary,
    actor: item.activity_type ?? 'system',
    createdAt: formatApiDate(item.occurred_at),
  }
}

export function mapUserProfile(item: ApiUserProfile): UserProfileRecord {
  return {
    id: item.id,
    name: `${item.first_name} ${item.last_name}`.trim(),
    email: `${item.first_name}.${item.last_name}@kncl.local`,
    role: item.role as UserRole,
    phone: item.phone ?? undefined,
  }
}

export function mapEngagement(
  item: EngagementApiRecord,
  clubs: Map<string, { name: string }>,
  profiles: Map<string, ApiUserProfile>,
  players: Map<string, { name: string; clubId?: string; club?: string }>,
  listings?: Map<string, { name: string; club?: string; clubId?: string }>,
): EngagementRequest {
  const listing = listings?.get(item.player_id)
  const player = players.get(item.player_id)
  const playerName = listing?.name ?? player?.name ?? 'Player'
  const requestingClub = clubs.get(item.requesting_club_id)
  const captain = profiles.get(item.requesting_captain_id)
  const isFreeAgent = item.player_commitment_status === 'FREE_AGENT'

  return {
    id: item.id,
    playerId: item.player_id,
    playerName,
    playerCommitmentStatus: item.player_commitment_status as EngagementRequest['playerCommitmentStatus'],
    playerCurrentClubId: listing?.clubId ?? player?.clubId,
    playerCurrentClubName: listing?.club ?? player?.club,
    requestingClubId: item.requesting_club_id,
    requestingClubName: requestingClub?.name ?? 'Club',
    requestingCaptainId: item.requesting_captain_id,
    requestingCaptainName: captain ? `${captain.first_name} ${captain.last_name}`.trim() : 'Captain',
    recipientType: item.recipient_type,
    recipientClubId: item.recipient_club_id ?? undefined,
    message: item.message ?? '',
    status: item.status as EngagementRequest['status'],
    createdAt: formatApiDate(item.created_at),
    playerCc: !isFreeAgent,
  }
}

export function adminStatsFromTotals(totals: {
  clubs: number
  players: number
  registrations: number
  transfers: number
  unread_notifications?: number
  pending_club_applications?: number
  pending_player_applications?: number
  pending_engagements?: number
  pending_headshots?: number
}): DashboardStat[] {
  return [
    { label: 'Clubs', value: String(totals.clubs) },
    { label: 'Players', value: String(totals.players) },
    { label: 'Pending club apps', value: String(totals.pending_club_applications ?? 0) },
    { label: 'Pending player apps', value: String(totals.pending_player_applications ?? 0) },
    { label: 'Pending headshots', value: String(totals.pending_headshots ?? 0) },
    { label: 'Pending engagements', value: String(totals.pending_engagements ?? 0) },
    { label: 'Registrations', value: String(totals.registrations) },
    { label: 'Transfers', value: String(totals.transfers) },
  ]
}
