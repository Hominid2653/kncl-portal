import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export interface ListResponse<T> {
  items: T[]
  total: number
}

async function list<T>(path: string, options?: { public?: boolean }): Promise<ListResponse<T> | null> {
  if (!USE_API) return null
  return apiRequest<ListResponse<T>>(path, options)
}

export const listLeagues = () => list<ApiLeague>('/leagues/')
export const listPublicLeagues = () => list<ApiLeague>('/leagues/public', { public: true })
export const listClubs = () => list<ApiClub>('/clubs/')
export const listPlayers = () => list<ApiPlayer>('/players/')
export const listClubMembers = () => list<ApiClubMember>('/club-members/')
export const listRegistrations = () => list<ApiRegistration>('/registrations/')
export const listRosterEnrollments = () => list<ApiRegistration>('/roster-enrollments/')
export const listTransfers = () => list<ApiTransfer>('/transfers/')
export const listNotifications = () => list<ApiNotification>('/notifications/')
export const listDocuments = () => list<ApiDocument>('/documents/')
export const listAuditLogs = () => list<ApiAuditLog>('/audit-logs/')
export const listUserProfiles = () => list<ApiUserProfile>('/user-profiles/')

export async function getAdminDashboard() {
  if (!USE_API) return null
  return apiRequest<ApiAdminDashboard>('/dashboard/admin')
}

export async function getClubDashboard() {
  if (!USE_API) return null
  return apiRequest<ApiClubDashboard>('/dashboard/club')
}

export async function getPlayerDashboard() {
  if (!USE_API) return null
  return apiRequest<ApiPlayerDashboard>('/dashboard/player')
}

export async function approveTransfer(id: string, remarks?: string) {
  if (!USE_API) return null
  return apiRequest(`/transfers/${id}/approve`, { method: 'POST', body: { remarks } })
}

export async function rejectTransfer(id: string, remarks?: string) {
  if (!USE_API) return null
  return apiRequest(`/transfers/${id}/reject`, { method: 'POST', body: { remarks } })
}

export async function approveRosterEnrollment(id: string, remarks?: string) {
  if (!USE_API) return null
  return apiRequest(`/roster-enrollments/${id}/approve`, { method: 'POST', body: { remarks } })
}

export async function rejectRosterEnrollment(id: string, remarks?: string) {
  if (!USE_API) return null
  return apiRequest(`/roster-enrollments/${id}/reject`, { method: 'POST', body: { remarks } })
}

export async function createTransfer(payload: {
  registration_id?: string
  from_club_id: string
  to_club_id: string
  reason?: string
  source?: string
  player_id?: string
  engagement_id?: string
}) {
  if (!USE_API) return null
  return apiRequest('/transfers/', { method: 'POST', body: payload })
}

// --- API shapes (snake_case from backend) ---

export interface ApiLeague {
  id: string
  name: string
  description?: string | null
}

export interface ApiClub {
  id: string
  league_id: string
  name: string
  county?: string | null
  description?: string | null
  approved_roster_count?: number
  initial_roster_period_active?: boolean
}

export interface ApiPlayer {
  id: string
  user_profile_id: string
  federation_id?: string | null
  fide_id?: string | null
  chesscom_username?: string | null
  lichess_username?: string | null
  lichess_verified?: boolean
  chesscom_verified?: boolean
  classical_rating?: number | null
  rapid_rating?: number | null
  blitz_rating?: number | null
  nationality?: string | null
}

export interface ApiClubMember {
  id: string
  club_id: string
  user_profile_id: string
  position: string
  created_at?: string
}

export interface ApiRegistration {
  id: string
  player_id: string
  club_id: string
  season_id: string
  status: string
  registered_at: string
}

export interface ApiTransfer {
  id: string
  registration_id: string
  from_club_id: string
  to_club_id: string
  reason?: string | null
  source?: string
  player_id?: string | null
  engagement_id?: string | null
  status: string
  submitted_at: string
}

export interface ApiNotification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface ApiDocument {
  id: string
  transfer_id: string
  document_type?: string | null
  file_name?: string | null
  uploaded_at: string
}

export interface ApiAuditLog {
  id: string
  action: string
  entity: string
  user_profile_id: string
  created_at: string
}

export interface ApiUserProfile {
  id: string
  first_name: string
  last_name: string
  phone?: string | null
  role: string
  auth_user_id: string
}

export interface ApiAdminDashboard {
  totals: {
    clubs: number
    players: number
    registrations: number
    transfers: number
    unread_notifications: number
    pending_club_applications?: number
    pending_player_applications?: number
    pending_engagements?: number
    pending_headshots?: number
  }
  transfer_counts?: Array<{ status: string; count: number }>
  pending_by_club?: Array<{
    club_id: string
    club_name: string
    pending_transfers: number
    pending_registrations: number
  }>
  recent_activity: ApiActivityItem[]
}

export interface ApiClubDashboard {
  clubs: Array<{
    club_id: string
    club_name: string
    pending_transfers: number
    pending_registrations: number
    pending_engagements?: number
  }>
  unread_notifications: number
  recent_activity: ApiActivityItem[]
}

export interface ApiPlayerDashboard {
  registrations: Array<{
    registration_id: string
    season_id: string
    club_id: string
    status: string
    registered_at: string
  }>
  transfers: Array<{
    transfer_id: string
    from_club_id: string
    to_club_id: string
    status: string
    submitted_at: string
  }>
  unread_notifications: number
  recent_activity: ApiActivityItem[]
}

export interface ApiActivityItem {
  id: string
  action: string
  summary: string
  occurred_at: string
  activity_type?: string
}
