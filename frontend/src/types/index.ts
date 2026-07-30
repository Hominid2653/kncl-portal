export type UserRole = 'PLAYER' | 'CLUB_ADMIN' | 'LEAGUE_COORDINATOR' | 'FEDERATION_ADMIN'

export type RosterEnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
/** @deprecated Use RosterEnrollmentStatus */
export type RegistrationStatus = RosterEnrollmentStatus
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type PlayerCommitmentStatus = 'FREE_AGENT' | 'COMMITTED'
export type EngagementStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN'
export type EngagementRecipientType = 'PLAYER' | 'CLUB_CAPTAIN'

export interface PlayerListingRecord {
  id: string
  federationId: string
  name: string
  commitmentStatus: PlayerCommitmentStatus
  club?: string
  clubId?: string
  county: string
  fideRating?: number
  lichessUsername?: string
  chesscomUsername?: string
  lichessVerified: boolean
  chesscomVerified: boolean
  nationality: string
  title?: string
  lastActive: string
  headshotUrl?: string
}

export interface EngagementRequest {
  id: string
  playerId: string
  playerName: string
  playerCommitmentStatus: PlayerCommitmentStatus
  playerCurrentClubId?: string
  playerCurrentClubName?: string
  requestingClubId: string
  requestingClubName: string
  requestingCaptainId: string
  requestingCaptainName: string
  recipientType: EngagementRecipientType
  recipientClubId?: string
  message: string
  status: EngagementStatus
  createdAt: string
  playerCc?: boolean
  rosterEnrollmentInitiated?: boolean
  rosterEnrollmentId?: string
  transferInitiated?: boolean
  transferId?: string
}

export interface MockUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  clubId?: string
  clubName?: string
  playerId?: string
  leagueIds?: string[]
}

export interface PlayerRecord {
  id: string
  federationId: string
  name: string
  club: string
  clubId: string
  fideRating?: number
  lichessUsername?: string
  chesscomUsername?: string
  lichessVerified: boolean
  chesscomVerified: boolean
  nationality: string
}

export interface LeagueRecord {
  id: string
  name: string
  description: string
}

export interface SeasonRecord {
  id: string
  name: string
  leagueId: string
  leagueName: string
  year: number
  rosterEnrollmentOpen: boolean
  transfersOpen: boolean
}

export interface ClubRecord {
  id: string
  name: string
  league: string
  leagueId: string
  county: string
  players: number
  initialRosterPeriod?: boolean
}

export interface ClubMemberRecord {
  id: string
  playerName: string
  club: string
  position: string
  joinedAt: string
}

export interface RosterEnrollmentRecord {
  id: string
  playerId: string
  playerName: string
  clubId: string
  club: string
  season: string
  status: RosterEnrollmentStatus
  submittedAt: string
  source?: 'FREE_AGENT_ENGAGEMENT' | 'MANUAL' | 'TRANSFER'
  engagementId?: string
}

export interface TransferRecord {
  id: string
  playerId?: string
  playerName: string
  fromClubId: string
  fromClub: string
  toClubId: string
  toClub: string
  status: TransferStatus
  submittedAt: string
  reason?: string
  source?: 'ENGAGEMENT' | 'PLAYER_REQUEST' | 'COORDINATOR_MANUAL'
  engagementId?: string
  submittedByPlayerId?: string
}

export interface DocumentRecord {
  id: string
  title: string
  type: string
  linkedTo: string
  uploadedAt: string
}

export interface NotificationRecord {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface AuditLogRecord {
  id: string
  action: string
  entity: string
  actor: string
  createdAt: string
}

export interface UserProfileRecord {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
}

export interface ClubCaptainApplication {
  id: string
  clubName: string
  county: string
  leagueId: string
  leagueName: string
  description?: string
  charterFileName?: string
  charterUrl?: string
  captainFirstName: string
  captainLastName: string
  captainEmail: string
  captainPhone: string
  status: ApplicationStatus
  submittedAt: string
  emailVerifiedAt?: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
  createdClubId?: string
}

export interface PlayerRegistrationApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  county: string
  nationality: string
  leagueId: string
  leagueName: string
  status: ApplicationStatus
  submittedAt: string
  emailVerifiedAt?: string
  federationId?: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface HeadshotModerationRequest {
  id: string
  playerId: string
  playerName: string
  leagueId: string
  proposedUrl: string
  status: ApplicationStatus
  submittedAt: string
  rejectionReason?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface DashboardStat {
  label: string
  value: string
}

/** Legacy scaffold pages (src/routes.tsx) */
export interface DashboardMetric {
  label: string
  value: string
  detail: string
}

export interface ScaffoldPlayerRow {
  id: string
  name: string
  club: string
  status: string
  rating: string
  lastUpdated: string
}

export interface TransferItem {
  id: string
  playerName: string
  fromClub: string
  toClub: string
  status: 'Pending' | 'Approved' | 'Needs review'
  submitted: string
}

export interface SidebarNavItem {
  title: string
  href: string
  icon: string
}
