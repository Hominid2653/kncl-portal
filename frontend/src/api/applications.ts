/**
 * Onboarding application APIs — Phase 3 backend wiring.
 * Default: mock no-op; set VITE_USE_API=true to call FastAPI.
 */

import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'

export interface SubmitClubApplicationPayload {
  club_name: string
  county: string
  league_id: string
  description?: string
  captain_first_name: string
  captain_last_name: string
  captain_email: string
  captain_phone: string
}

export interface SubmitPlayerApplicationPayload {
  first_name: string
  last_name: string
  email: string
  county: string
  nationality: string
  league_id?: string
}

export interface ApplicationReviewPayload {
  status: 'APPROVED' | 'REJECTED'
  rejection_reason?: string
}

export async function postClubApplication(
  payload: SubmitClubApplicationPayload,
  emailVerificationToken: string,
) {
  if (!USE_API) return null
  return apiRequest<{ id: string; status: string }>('/club-applications/', {
    method: 'POST',
    body: payload,
    emailVerificationToken,
  })
}

export async function postPlayerApplication(
  payload: SubmitPlayerApplicationPayload,
  emailVerificationToken: string,
) {
  if (!USE_API) return null
  return apiRequest<{ id: string; status: string }>('/player-applications/', {
    method: 'POST',
    body: payload,
    emailVerificationToken,
  })
}

export async function listClubApplications(token?: string | null) {
  if (!USE_API) return null
  return apiRequest<{ items: unknown[]; total: number }>('/club-applications/?page_size=100', { token })
}

export async function listPlayerApplications(token?: string | null) {
  if (!USE_API) return null
  return apiRequest<{ items: unknown[]; total: number }>('/player-applications/?page_size=100', { token })
}

export async function reviewClubApplication(
  id: string,
  payload: ApplicationReviewPayload,
  token?: string | null,
) {
  if (!USE_API) return null
  return apiRequest(`/club-applications/${id}`, {
    method: 'PATCH',
    body: payload,
    token,
  })
}

export async function reviewPlayerApplication(
  id: string,
  payload: ApplicationReviewPayload,
  token?: string | null,
) {
  if (!USE_API) return null
  return apiRequest(`/player-applications/${id}`, {
    method: 'PATCH',
    body: payload,
    token,
  })
}

export async function createCoordinator(
  payload: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    league_ids: string[]
  },
  token: string,
) {
  if (!USE_API) return null
  return apiRequest('/users/coordinators', {
    method: 'POST',
    body: payload,
    token,
  })
}
