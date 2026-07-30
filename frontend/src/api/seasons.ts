import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export interface SeasonApiRecord {
  id: string
  league_id: string
  name: string
  year: number
  roster_enrollment_open: boolean
  transfers_open: boolean
}

export async function listSeasons(token?: string | null) {
  if (!USE_API) return null
  return apiRequest<{ items: SeasonApiRecord[]; total: number }>('/seasons/', { token })
}

export async function patchSeason(
  seasonId: string,
  payload: Partial<Pick<SeasonApiRecord, 'roster_enrollment_open' | 'transfers_open'>>,
  token?: string | null,
) {
  if (!USE_API) return null
  return apiRequest<SeasonApiRecord>(`/seasons/${seasonId}`, {
    method: 'PATCH',
    body: payload,
    token,
  })
}
