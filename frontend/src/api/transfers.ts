import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export async function listRosterEnrollments(token: string) {
  if (!USE_API) return null
  return apiRequest<{ items: unknown[]; total: number }>('/roster-enrollments/', { token })
}

export async function submitRosterEnrollment(
  payload: { player_id: string; club_id: string; season_id: string },
  token: string,
) {
  if (!USE_API) return null
  return apiRequest('/roster-enrollments/', {
    method: 'POST',
    body: payload,
    token,
  })
}

export async function listTransfers(token: string) {
  if (!USE_API) return null
  return apiRequest<{ items: unknown[]; total: number }>('/transfers/', { token })
}

export async function submitPlayerTransferRequest(
  payload: { from_club_id: string; to_club_id: string; reason: string },
  token: string,
) {
  if (!USE_API) return null
  return apiRequest('/transfers/player-request', {
    method: 'POST',
    body: payload,
    token,
  })
}
