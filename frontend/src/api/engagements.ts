import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export interface EngagementApiRecord {
  id: string
  player_id: string
  requesting_club_id: string
  requesting_captain_id: string
  recipient_type: 'PLAYER' | 'CLUB_CAPTAIN'
  recipient_club_id?: string | null
  status: string
  player_commitment_status: string
  message?: string | null
  created_at: string
  responded_at?: string | null
}

export async function listEngagements() {
  if (!USE_API) return null
  return apiRequest<{ items: EngagementApiRecord[]; total: number }>('/engagements/')
}

export async function createEngagement(payload: { player_id: string; message: string }) {
  if (!USE_API) return null
  return apiRequest<EngagementApiRecord>('/engagements/', {
    method: 'POST',
    body: payload,
  })
}

export async function respondEngagement(
  id: string,
  status: 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN',
) {
  if (!USE_API) return null
  return apiRequest<EngagementApiRecord>(`/engagements/${id}`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function listPlayerListings(params?: {
  search?: string
  commitment_status?: string
  page?: number
}) {
  if (!USE_API) return null
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.commitment_status) query.set('commitment_status', params.commitment_status)
  if (params?.page) query.set('page', String(params.page))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest<{ items: PlayerListingApiItem[]; total: number }>(`/players/listings${suffix}`, {
    public: true,
  })
}

interface PlayerListingApiItem {
  id: string
  federation_id?: string | null
  name: string
  commitment_status: 'FREE_AGENT' | 'COMMITTED'
  club?: { id: string; name: string } | null
  county?: string | null
  fide_rating?: number | null
  lichess_username?: string | null
  chesscom_username?: string | null
  lichess_verified?: boolean
  chesscom_verified?: boolean
  nationality?: string | null
  headshot_url?: string | null
  last_active?: string | null
}
