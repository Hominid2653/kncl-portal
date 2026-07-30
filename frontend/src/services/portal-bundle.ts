import {
  getAdminDashboard,
  getClubDashboard,
  getPlayerDashboard,
  listAuditLogs,
  listClubMembers,
  listClubs,
  listDocuments,
  listLeagues,
  listNotifications,
  listPlayers,
  listRegistrations,
  listUserProfiles,
  type ApiClub,
  type ApiPlayer,
  type ApiUserProfile,
} from '@/api/resources'
import { listSeasons } from '@/api/seasons'
import {
  adminDashboardStats as mockAdminStats,
  auditLogs as mockAuditLogs,
  clubDashboardStats as mockClubStats,
  clubMembers as mockClubMembers,
  clubs as mockClubs,
  documents as mockDocuments,
  leagues as mockLeagues,
  marketingStats as mockMarketingStats,
  notifications as mockNotifications,
  playerDashboardStats as mockPlayerStats,
  players as mockPlayers,
  registrations as mockRegistrations,
  userProfiles as mockUserProfiles,
} from '@/data/mockData'
import {
  adminStatsFromTotals,
  mapActivityLog,
  mapAuditLog,
  mapClub,
  mapClubMember,
  mapDocument,
  mapNotification,
  mapPlayer,
  mapRegistration,
  mapUserProfile,
} from '@/lib/api-mappers'
import { hasApiSession } from '@/lib/api-config'
import type {
  AuditLogRecord,
  ClubMemberRecord,
  ClubRecord,
  DashboardStat,
  DocumentRecord,
  LeagueRecord,
  NotificationRecord,
  PlayerRecord,
  RosterEnrollmentRecord,
  UserProfileRecord,
} from '@/types'
import type { MockUser } from '@/types'

export interface PortalBundle {
  leagues: LeagueRecord[]
  clubs: ClubRecord[]
  players: PlayerRecord[]
  clubMembers: ClubMemberRecord[]
  registrations: RosterEnrollmentRecord[]
  notifications: NotificationRecord[]
  documents: DocumentRecord[]
  auditLogs: AuditLogRecord[]
  userProfiles: UserProfileRecord[]
  adminDashboardStats: DashboardStat[]
  clubDashboardStats: DashboardStat[]
  playerDashboardStats: DashboardStat[]
  marketingStats: DashboardStat[]
  seasonNames: Record<string, string>
}

export const emptyPortalBundle: PortalBundle = {
  leagues: [],
  clubs: [],
  players: [],
  clubMembers: [],
  registrations: [],
  notifications: [],
  documents: [],
  auditLogs: [],
  userProfiles: [],
  adminDashboardStats: [],
  clubDashboardStats: [],
  playerDashboardStats: [],
  marketingStats: mockMarketingStats,
  seasonNames: {},
}

export const mockPortalBundle: PortalBundle = {
  leagues: mockLeagues,
  clubs: mockClubs,
  players: mockPlayers,
  clubMembers: mockClubMembers,
  registrations: mockRegistrations,
  notifications: mockNotifications,
  documents: mockDocuments,
  auditLogs: mockAuditLogs,
  userProfiles: mockUserProfiles,
  adminDashboardStats: mockAdminStats,
  clubDashboardStats: mockClubStats,
  playerDashboardStats: mockPlayerStats,
  marketingStats: mockMarketingStats,
  seasonNames: {},
}

function settledValue<T>(result: PromiseSettledResult<T | null>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

export async function fetchPortalBundle(user: MockUser | null): Promise<PortalBundle> {
  const settled = await Promise.allSettled([
    listLeagues(),
    listClubs(),
    listPlayers(),
    listUserProfiles(),
    listRegistrations(),
    listSeasons(),
  ])

  const leaguesRes = settledValue(settled[0])
  const clubsRes = settledValue(settled[1])
  const playersRes = settledValue(settled[2])
  const profilesRes = settledValue(settled[3])
  const registrationsRes = settledValue(settled[4])
  const seasonsRes = settledValue(settled[5])

  const leagueItems = leaguesRes?.items ?? []
  const leagueMap = new Map(leagueItems.map((l) => [l.id, l.name]))
  const leagues = leagueItems.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description ?? '',
  }))

  const clubItems = clubsRes?.items ?? []
  const clubMap = new Map<string, ApiClub>(clubItems.map((c) => [c.id, c]))
  const clubs = clubItems.map((c) => mapClub(c, leagueMap.get(c.league_id)))

  const profileItems = profilesRes?.items ?? []
  const profileMap = new Map<string, ApiUserProfile>(profileItems.map((p) => [p.id, p]))
  const userProfiles = profileItems.map(mapUserProfile)

  const playerItems = playersRes?.items ?? []
  const playerMap = new Map<string, ApiPlayer>(playerItems.map((p) => [p.id, p]))
  const regItems = registrationsRes?.items ?? []

  const seasonNames: Record<string, string> = {}
  seasonsRes?.items?.forEach((s) => {
    seasonNames[s.id] = s.name
  })

  const seasonMap = new Map(Object.entries(seasonNames).map(([k, v]) => [k, { name: v }]))
  const players = playerItems.map((p) => mapPlayer(p, profileMap, clubMap, regItems))
  const registrations = regItems.map((r) =>
    mapRegistration(r, playerMap, profileMap, clubMap, seasonMap),
  )

  let clubMembers: ClubMemberRecord[] = []
  let notifications: NotificationRecord[] = []
  let documents: DocumentRecord[] = []
  let auditLogs: AuditLogRecord[] = []
  let adminDashboardStats: DashboardStat[] = []
  let clubDashboardStats: DashboardStat[] = []
  let playerDashboardStats: DashboardStat[] = []

  if (hasApiSession()) {
    const authed = await Promise.allSettled([
      listClubMembers(),
      listNotifications(),
      listDocuments(),
      listAuditLogs(),
    ])

    const membersRes = settledValue(authed[0])
    const notifRes = settledValue(authed[1])
    const docsRes = settledValue(authed[2])
    const logsRes = settledValue(authed[3])

    clubMembers = (membersRes?.items ?? []).map((m) => mapClubMember(m, profileMap, clubMap))
    notifications = (notifRes?.items ?? []).map(mapNotification)
    documents = (docsRes?.items ?? []).map(mapDocument)
    auditLogs = (logsRes?.items ?? []).map((l) => mapAuditLog(l, profileMap))

    if (user?.role === 'FEDERATION_ADMIN' || user?.role === 'LEAGUE_COORDINATOR') {
      const admin = await getAdminDashboard()
      if (admin) {
        adminDashboardStats = adminStatsFromTotals(admin.totals)
        if (admin.recent_activity?.length) {
          auditLogs = admin.recent_activity.map(mapActivityLog)
        }
      }
    } else if (user?.role === 'CLUB_ADMIN') {
      const clubDash = await getClubDashboard()
      if (clubDash) {
        const summary = clubDash.clubs[0]
        clubDashboardStats = [
          { label: 'Pending registrations', value: String(summary?.pending_registrations ?? 0) },
          { label: 'Pending transfers', value: String(summary?.pending_transfers ?? 0) },
          { label: 'Pending engagements', value: String(summary?.pending_engagements ?? 0) },
          { label: 'Unread notifications', value: String(clubDash.unread_notifications) },
        ]
      }
    } else if (user?.role === 'PLAYER') {
      const playerDash = await getPlayerDashboard()
      if (playerDash) {
        playerDashboardStats = [
          { label: 'Registrations', value: String(playerDash.registrations.length) },
          { label: 'Transfers', value: String(playerDash.transfers.length) },
          { label: 'Unread notifications', value: String(playerDash.unread_notifications) },
          { label: 'Recent activity', value: String(playerDash.recent_activity.length) },
        ]
      }
    }
  }

  return {
    leagues,
    clubs,
    players,
    clubMembers,
    registrations,
    notifications,
    documents,
    auditLogs,
    userProfiles,
    adminDashboardStats,
    clubDashboardStats,
    playerDashboardStats,
    marketingStats: mockMarketingStats,
    seasonNames,
  }
}
