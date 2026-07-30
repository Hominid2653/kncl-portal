import { apiRequest, API_BASE } from '@/api/client'
import { getApiAuthHeaders, USE_API } from '@/lib/api-config'

export interface HeadshotApiResponse {
  player_id: string
  headshot_url?: string | null
  headshot_source?: string | null
  headshot_moderation_status: string
  headshot_updated_at?: string | null
}

export interface VerificationCodeApiResponse {
  player_id: string
  platform: string
  username: string
  verification_code: string
  instructions: string
}

export async function uploadPlayerHeadshot(playerId: string, file: File) {
  if (!USE_API) return null
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/players/${playerId}/headshot/upload`, {
    method: 'POST',
    headers: getApiAuthHeaders(),
    body: formData,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string; detail?: string }
    throw new Error(payload.message ?? (typeof payload.detail === 'string' ? payload.detail : 'Headshot upload failed'))
  }
  return response.json() as Promise<HeadshotApiResponse>
}

export async function updatePlayerHeadshot(
  playerId: string,
  payload: { headshot_url: string; headshot_source?: 'URL' | 'UPLOAD' },
) {
  if (!USE_API) return null
  return apiRequest<HeadshotApiResponse>(`/players/${playerId}/headshot`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function moderatePlayerHeadshot(
  playerId: string,
  status: 'APPROVED' | 'REJECTED' | 'PENDING',
) {
  if (!USE_API) return null
  return apiRequest<HeadshotApiResponse>(`/players/${playerId}/headshot/moderate`, {
    method: 'PATCH',
    body: { headshot_moderation_status: status },
  })
}

export async function listPlayersPendingHeadshots() {
  if (!USE_API) return null
  return apiRequest<{
    items: Array<{
      player_id: string
      player_name: string
      headshot_url?: string | null
      league_id?: string | null
      headshot_updated_at?: string | null
    }>
    total: number
  }>('/players/headshots/pending')
}

export async function syncLichessRatings(playerId: string) {
  if (!USE_API) return null
  return apiRequest(`/players/${playerId}/lichess/sync`, { method: 'POST' })
}

export async function requestLichessVerification(playerId: string) {
  if (!USE_API) return null
  return apiRequest<VerificationCodeApiResponse>(`/players/${playerId}/lichess/verify`, {
    method: 'POST',
  })
}

export async function confirmLichessVerification(playerId: string) {
  if (!USE_API) return null
  return apiRequest(`/players/${playerId}/lichess/verify`, { method: 'PATCH' })
}

export async function syncChesscomRatings(playerId: string) {
  if (!USE_API) return null
  return apiRequest(`/players/${playerId}/chesscom/sync`, { method: 'POST' })
}

export async function requestChesscomVerification(playerId: string) {
  if (!USE_API) return null
  return apiRequest<VerificationCodeApiResponse>(`/players/${playerId}/chesscom/verify`, {
    method: 'POST',
  })
}

export async function confirmChesscomVerification(playerId: string) {
  if (!USE_API) return null
  return apiRequest(`/players/${playerId}/chesscom/verify`, { method: 'PATCH' })
}
