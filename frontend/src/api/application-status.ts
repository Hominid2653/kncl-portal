import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export interface ApplicationStatusApiResponse {
  email: string
  club_application?: {
    id: string
    club_name: string
    status: string
    rejection_reason?: string | null
    submitted_at: string
    reviewed_at?: string | null
  } | null
  player_application?: {
    id: string
    first_name: string
    last_name: string
    status: string
    rejection_reason?: string | null
    submitted_at: string
    reviewed_at?: string | null
  } | null
}

export async function fetchApplicationStatus(emailVerificationToken: string) {
  if (!USE_API) return null
  return apiRequest<ApplicationStatusApiResponse>('/application-status', {
    emailVerificationToken,
  })
}
