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
  SeasonRecord,
  TransferRecord,
  UserProfileRecord,
} from '@/types'

export const marketingStats: DashboardStat[] = [
  { label: 'Active players', value: '1,248' },
  { label: 'Registered clubs', value: '42' },
  { label: 'Pending transfers', value: '36' },
  { label: 'Verified profiles', value: '94%' },
]

export const playerDashboardStats: DashboardStat[] = [
  { label: 'Registrations', value: '2' },
  { label: 'Pending transfers', value: '1' },
  { label: 'Unread notifications', value: '3' },
  { label: 'Verified accounts', value: '1/2' },
]

export const clubDashboardStats: DashboardStat[] = [
  { label: 'Roster size', value: '38' },
  { label: 'Pending registrations', value: '4' },
  { label: 'Pending transfers', value: '2' },
  { label: 'Documents', value: '6' },
]

export const adminDashboardStats: DashboardStat[] = [
  { label: 'Clubs', value: '42' },
  { label: 'Players', value: '1,248' },
  { label: 'Pending registrations', value: '18' },
  { label: 'Pending transfers', value: '36' },
]

export const leagues: LeagueRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Kenya National Chess League',
    description: 'Official national chess league for club-based team competitions across Kenya.',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Kenya Women\'s Chess League',
    description: 'Women\'s club league — coordinated separately from KNCL.',
  },
]

export const seasons: SeasonRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'KNCL 2025 Season',
    leagueId: '11111111-1111-4111-8111-111111111101',
    leagueName: 'Kenya National Chess League',
    year: 2025,
    rosterEnrollmentOpen: false,
    transfersOpen: false,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'KNCL 2026 Season',
    leagueId: '11111111-1111-4111-8111-111111111101',
    leagueName: 'Kenya National Chess League',
    year: 2026,
    rosterEnrollmentOpen: true,
    transfersOpen: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'KWCL 2026 Season',
    leagueId: '11111111-1111-4111-8111-111111111104',
    leagueName: 'Kenya Women\'s Chess League',
    year: 2026,
    rosterEnrollmentOpen: true,
    transfersOpen: false,
  },
]

export const clubs: ClubRecord[] = [
  { id: '22222222-2222-4222-8222-222222222201', name: 'Nairobi Kings', league: 'KNCL', leagueId: '11111111-1111-4111-8111-111111111101', county: 'Nairobi', players: 38 },
  { id: '22222222-2222-4222-8222-222222222202', name: 'Mombasa Rooks', league: 'KNCL', leagueId: '11111111-1111-4111-8111-111111111101', county: 'Mombasa', players: 29 },
  { id: '22222222-2222-4222-8222-222222222203', name: 'Kisumu Lions', league: 'KNCL', leagueId: '11111111-1111-4111-8111-111111111101', county: 'Kisumu', players: 24 },
]

export const players: PlayerRecord[] = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    federationId: 'KEN-2401',
    name: 'Moses Kamau',
    club: 'Nairobi Kings',
    clubId: '22222222-2222-4222-8222-222222222201',
    fideRating: 2200,
    lichessUsername: 'moseskamau',
    chesscomUsername: 'moseskamau_ke',
    lichessVerified: true,
    chesscomVerified: false,
    nationality: 'Kenya',
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    federationId: 'KEN-2402',
    name: 'Amina Hassan',
    club: 'Mombasa Rooks',
    clubId: '22222222-2222-4222-8222-222222222202',
    fideRating: 2145,
    lichessUsername: 'aminahassan',
    lichessVerified: false,
    chesscomVerified: false,
    nationality: 'Kenya',
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    federationId: 'KEN-2403',
    name: 'Daniel Otieno',
    club: 'Kisumu Lions',
    clubId: '22222222-2222-4222-8222-222222222203',
    fideRating: 2310,
    chesscomUsername: 'dotieno',
    lichessVerified: false,
    chesscomVerified: true,
    nationality: 'Kenya',
  },
]

export const clubMembers: ClubMemberRecord[] = [
  { id: '1', playerName: 'Moses Kamau', club: 'Nairobi Kings', position: 'Board 1', joinedAt: 'Jan 2024' },
  { id: '2', playerName: 'Grace Wanjiru', club: 'Nairobi Kings', position: 'Board 2', joinedAt: 'Mar 2024' },
  { id: '3', playerName: 'Brian Mwangi', club: 'Nairobi Kings', position: 'Reserve', joinedAt: 'Jul 2025' },
]

export const rosterEnrollments: RosterEnrollmentRecord[] = [
  { id: 'RE-301', playerId: '44444444-4444-4444-8444-444444444503', playerName: 'Brian Mwangi', clubId: '22222222-2222-4222-8222-222222222201', club: 'Nairobi Kings', season: 'KNCL 2026 Season', status: 'PENDING', submittedAt: 'Jul 28, 08:30', source: 'FREE_AGENT_ENGAGEMENT', engagementId: 'E-003' },
  { id: 'RE-302', playerId: '44444444-4444-4444-8444-444444444502', playerName: 'Kevin Ochieng', clubId: '22222222-2222-4222-8222-222222222202', club: 'Mombasa Rooks', season: 'KNCL 2026 Season', status: 'APPROVED', submittedAt: 'Jul 27, 14:10', source: 'FREE_AGENT_ENGAGEMENT' },
  { id: 'RE-303', playerId: '44444444-4444-4444-8444-444444444501', playerName: 'Faith Njeri', clubId: '22222222-2222-4222-8222-222222222203', club: 'Kisumu Lions', season: 'KNCL 2026 Season', status: 'PENDING', submittedAt: 'Jul 26, 11:45', source: 'FREE_AGENT_ENGAGEMENT' },
]

/** @deprecated Use rosterEnrollments */
export const registrations = rosterEnrollments

export const transfers: TransferRecord[] = [
  { id: 'T-201', playerId: '44444444-4444-4444-8444-444444444401', playerName: 'Moses Kamau', fromClubId: '22222222-2222-4222-8222-222222222201', fromClub: 'Nairobi Kings', toClubId: '22222222-2222-4222-8222-222222222203', toClub: 'Kisumu Lions', status: 'PENDING', submittedAt: 'Jul 28, 08:30', reason: 'Relocation', source: 'PLAYER_REQUEST', submittedByPlayerId: '44444444-4444-4444-8444-444444444401' },
  { id: 'T-202', playerId: '44444444-4444-4444-8444-444444444402', playerName: 'Amina Hassan', fromClubId: '22222222-2222-4222-8222-222222222202', fromClub: 'Mombasa Rooks', toClubId: '22222222-2222-4222-8222-222222222203', toClub: 'Kisumu Lions', status: 'APPROVED', submittedAt: 'Jul 27, 11:10', source: 'ENGAGEMENT' },
  { id: 'T-203', playerId: '44444444-4444-4444-8444-444444444403', playerName: 'Daniel Otieno', fromClubId: '22222222-2222-4222-8222-222222222203', fromClub: 'Kisumu Lions', toClubId: '22222222-2222-4222-8222-222222222201', toClub: 'Nairobi Kings', status: 'PENDING', submittedAt: 'Jul 26, 14:45', source: 'ENGAGEMENT' },
]

export const documents: DocumentRecord[] = [
  { id: 'D-401', title: 'Club charter 2026', type: 'Charter', linkedTo: 'Eldoret Falcons', uploadedAt: 'Jul 25, 2026' },
  { id: 'D-402', title: 'Transfer consent letter', type: 'Consent', linkedTo: 'Moses Kamau', uploadedAt: 'Jul 28, 2026' },
  { id: 'D-403', title: 'Player ID scan', type: 'Identity', linkedTo: 'Faith Njeri', uploadedAt: 'Jul 27, 2026' },
]

export const notifications: NotificationRecord[] = [
  { id: 'N-1', title: 'Transfer pending', message: 'Moses Kamau transfer requires federation review.', read: false, createdAt: '2h ago' },
  { id: 'N-2', title: 'Registration submitted', message: 'New player registration from Mombasa Rooks.', read: false, createdAt: '5h ago' },
  { id: 'N-3', title: 'Document uploaded', message: 'Club charter for Eldoret Falcons received.', read: true, createdAt: 'Yesterday' },
]

export const auditLogs: AuditLogRecord[] = [
  { id: 'A-1', action: 'roster_enrollment.approved', entity: 'Enrollment RE-302', actor: 'James Mutua', createdAt: 'Jul 27, 14:15' },
  { id: 'A-2', action: 'transfer.submitted', entity: 'Transfer T-201', actor: 'Peter Ochieng', createdAt: 'Jul 28, 08:30' },
  { id: 'A-3', action: 'player.created', entity: 'Player KEN-2404', actor: 'Peter Ochieng', createdAt: 'Jul 26, 10:00' },
]

export const userProfiles: UserProfileRecord[] = [
  { id: '1', name: 'Grace Wanjiru', email: 'admin@kncl.local', role: 'FEDERATION_ADMIN', phone: '+254700000001' },
  { id: '2', name: 'James Mutua', email: 'coordinator@kncl.local', role: 'LEAGUE_COORDINATOR' },
  { id: '3', name: 'Peter Ochieng', email: 'captain.nairobi@kncl.local', role: 'CLUB_ADMIN', phone: '+254700000003' },
  { id: '4', name: 'Moses Kamau', email: 'player1@kncl.local', role: 'PLAYER' },
import type { DashboardMetric, PlayerRecord, TransferItem } from '../types'

export const stats: DashboardMetric[] = [
  { label: 'Active players', value: '1,248', detail: 'Across 42 clubs' },
  { label: 'Pending transfers', value: '36', detail: 'Reviewed this week' },
  { label: 'Verified profiles', value: '94%', detail: 'Cross-checked by staff' },
]

export const playerRecords: PlayerRecord[] = [
  { id: 'P-101', name: 'Moses Kamau', club: 'Nairobi Kings', status: 'Verified', rating: '2200', lastUpdated: '2h ago' },
  { id: 'P-102', name: 'Amina Hassan', club: 'Mombasa Rooks', status: 'Pending review', rating: '2145', lastUpdated: '5h ago' },
  { id: 'P-103', name: 'Daniel Otieno', club: 'Kisumu Lions', status: 'Approved', rating: '2310', lastUpdated: 'Yesterday' },
]

export const transferQueue: TransferItem[] = [
  { id: 'T-201', playerName: 'Moses Kamau', fromClub: 'Nairobi Kings', toClub: 'Eldoret Falcons', status: 'Pending', submitted: '08:30' },
  { id: 'T-202', playerName: 'Amina Hassan', fromClub: 'Mombasa Rooks', toClub: 'Kisumu Lions', status: 'Approved', submitted: '11:10' },
  { id: 'T-203', playerName: 'Daniel Otieno', fromClub: 'Kisumu Lions', toClub: 'Nairobi Kings', status: 'Needs review', submitted: '14:45' },
]
